import type { PermissionStore } from "fake-permissions";
import {
  GeolocationPositionError,
  createPermissionDeniedError,
  createPositionUnavailableError,
  createTimeoutError,
} from "./geolocation-position-error.js";
import { createPosition, isHighAccuracy } from "./geolocation-position.js";
import { LocationServices } from "./location-services.js";

/**
 * @inline
 */
export interface GeolocationParameters {
  locationServices: LocationServices;
  permissionStore: PermissionStore;
}

const descriptor: PermissionDescriptor = { name: "geolocation" };
let canConstruct = false;

export function createGeolocation(
  params: GeolocationParameters,
): globalThis.Geolocation {
  canConstruct = true;

  return new Geolocation(params);
}

export class Geolocation {
  constructor({ locationServices, permissionStore }: GeolocationParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#locationServices = locationServices;
    this.#permissionStore = permissionStore;
    this.#cachedPosition = null;
    this.#watchIds = [];
    this.#watchControllers = {};
    this.#watchId = 1;
  }

  /**
   * § 6.2 getCurrentPosition() method
   */
  getCurrentPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback | null,
    {
      enableHighAccuracy = false,
      maximumAge = 0,
      timeout = Infinity,
    }: PositionOptions = {},
  ): void {
    const options: Required<PositionOptions> = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    /*
     * 1. If the current settings object's relevant global object's associated
     *    Document is not fully active:
     *    1. Call back with error errorCallback and POSITION_UNAVAILABLE.
     *    2. Terminate this algorithm.
     */
    // step 1 is ignored since there is no "document"

    /*
     * 2. In parallel, request a position passing successCallback,
     *    errorCallback, and options.
     */
    this.#requestPosition(
      successCallback,
      errorCallback ?? undefined,
      options,
    ).catch(
      /* v8 ignore start: promise failsafe, can't occur normally */
      () => {},
      /* v8 ignore stop */
    );
  }

  /**
   * § 6.3 watchPosition() method
   */
  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback | null,
    {
      enableHighAccuracy = false,
      maximumAge = 0,
      timeout = Infinity,
    }: PositionOptions = {},
  ): number {
    const options: Required<PositionOptions> = {
      enableHighAccuracy,
      maximumAge,
      timeout,
    };

    /*
     * 1. If the current settings object's relevant global object's associated
     *    Document is not fully active:
     *    1. Call back with error passing errorCallback and
     *       POSITION_UNAVAILABLE.
     *    2. Return 0.
     */
    // step 1 is ignored since there is no "document"

    /*
     * 2. Let watchId be an implementation-defined unsigned long that is greater
     *    than zero.
     */
    const watchId = this.#watchId++;

    /*
     * 3. Append watchId to this's [[watchIDs]].
     */
    this.#watchIds.push(watchId);

    /*
     * 4. In parallel, request a position passing successCallback,
     *    errorCallback, options, and watchId.
     */
    this.#requestPosition(
      successCallback,
      errorCallback ?? undefined,
      options,
      watchId,
    ).catch(
      /* v8 ignore start: promise failsafe, can't occur normally */
      () => {},
      /* v8 ignore stop */
    );

    /*
     * 5. Return watchId.
     */
    return watchId;
  }

  /**
   * § 6.4 clearWatch() method
   */
  clearWatch(watchId: number): void {
    /*
     * 1. Remove watchId from this's [[watchIDs]].
     */
    this.#removeWatchId(this.#watchIds, watchId);
  }

  readonly [Symbol.toStringTag] = "Geolocation";

  /**
   * § 6.5 Request a position
   *
   * To request a position, pass a PositionCallback successCallback, a
   * PositionErrorCallback? errorCallback, PositionOptions options, and an
   * optional watchId:
   */
  async #requestPosition(
    successCallback: PositionCallback,
    errorCallback: PositionErrorCallback | undefined,
    options: Required<PositionOptions>,
    watchId?: number,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    let controller: AbortController | undefined;
    let isEstablished = false;

    if (typeof watchId === "number") {
      controller = new AbortController();
      this.#watchControllers[watchId] = controller;

      const unsubscribeLocation =
        this.#locationServices.subscribe(handleNewLocation);
      const unsubscribePermission = this.#permissionStore.subscribe(
        handlePermissionChange,
      );

      controller.signal.addEventListener(
        "abort",
        () => {
          unsubscribeLocation();
          unsubscribePermission();
        },
        { once: true },
      );
    }

    /*
     * 1. Let watchIDs be this's [[watchIDs]].
     */
    const watchIds = this.#watchIds;

    /*
     * 2. Let document be the current settings object's relevant global object's
     *    associated Document.
     * 3. If document is not allowed to use the "geolocation" feature:
     *    1. If watchId was passed, remove watchId from watchIDs.
     *    2. Call back with error passing errorCallback and PERMISSION_DENIED.
     *    3. Terminate this algorithm.
     * 4. If document's visibility state is "hidden", wait for the following
     *    page visibility change steps to run:
     *    1. Assert: document's visibility state is "visible".
     *    2. Continue to the next steps below.
     */
    // steps 2-4 are ignored since there is no "document"

    /*
     * 5. Let descriptor be a new PermissionDescriptor whose name is
     *    "geolocation".
     */
    // descriptor is defined as a constant at the top of the file

    /*
     * 6. Set permission to request permission to use descriptor.
     */
    const isAllowed = await this.#permissionStore.requestAccess(descriptor);

    /*
     * 7. If permission is "denied", then:
     */
    if (!isAllowed) {
      /*
       * 7. (cont.)
       *    1. If watchId was passed, remove watchId from watchIDs.
       */
      if (typeof watchId === "number") {
        this.#removeWatchId(watchIds, watchId);
      }

      /*
       * 7. (cont.)
       *    2. Call back with error passing errorCallback and PERMISSION_DENIED.
       *    3. Terminate this algorithm.
       */
      this.#invokeErrorCallback(errorCallback, createPermissionDeniedError(""));
      return;
    }

    isEstablished = true;

    /*
     * 8. Wait to [acquire a position] passing _successCallback_,
     *    _errorCallback_, _options_, and _watchId_.
     */
    await this.#acquirePosition(
      successCallback,
      errorCallback,
      options,
      watchId,
    );

    /*
     *  9. If watchId was not passed, terminate this algorithm.
     */
    if (typeof watchId !== "number") return;

    // If the watch was cleared while we were waiting for the position, don't
    // subscribe to anything.
    if (controller?.signal.aborted) return;

    /*
     * 10. While watchIDs contains watchId:
     *     1. Wait for a significant change of geographic position. What
     *        constitutes a significant change of geographic position is left to
     *        the implementation. User agents MAY impose a rate limit on how
     *        frequently position changes are reported.
     *     2. If document is not fully active or visibility state is not
     *        "visible", go back to the previous step and again wait for a
     *        significant change of geographic position.
     *     3. Wait to acquire a position passing successCallback, errorCallback,
     *        options, and watchId.
     */
    function handleNewLocation(isHighAccuracy: boolean): void {
      if (!isEstablished) return;
      if (isHighAccuracy !== options.enableHighAccuracy) return;

      /*
       * A user agent MAY evict [[cachedPosition]] by resetting it to null at
       * any time for any reason.
       */
      //
      // In this case, we need to evict the cached position, otherwise the
      // watch position callback is called with the cached position forever.
      self.#cachedPosition = null;
      self
        .#acquirePosition(successCallback, errorCallback, options, watchId)
        .catch(
          /* v8 ignore start: promise failsafe, can't occur normally */
          () => {},
          /* v8 ignore stop */
        );
    }

    function handlePermissionChange(
      descriptor: PermissionDescriptor,
      { hasAccess, hadAccess }: { hasAccess: boolean; hadAccess: boolean },
    ): void {
      if (!isEstablished) return;
      if (descriptor.name !== "geolocation") return;
      if (hasAccess === hadAccess) return;

      if (hasAccess) {
        // Produce a new position immediately when access is granted.
        self
          .#acquirePosition(successCallback, errorCallback, options, watchId)
          .catch(
            /* v8 ignore start: promise failsafe, can't occur normally */
            () => {},
            /* v8 ignore stop */
          );
      } else {
        // Produce PERMISSION_DENIED errors immediately when access is
        // revoked. This is not part of the spec, but Chrome does it, and it's
        // useful for testing.
        self.#invokeErrorCallback(
          errorCallback,
          createPermissionDeniedError(""),
        );
      }
    }
  }

  /**
   * § 6.6 Acquire a position
   *
   * To acquire a position, passing PositionCallback successCallback, a
   * PositionErrorCallback? errorCallback, PositionOptions options, and an
   * optional watchId.
   */
  async #acquirePosition(
    successCallback: PositionCallback,
    errorCallback: PositionErrorCallback | undefined,
    options: Required<PositionOptions>,
    watchId?: number,
  ): Promise<void> {
    /*
     * 1. If watchId was passed and this's [[watchIDs]] does not contain
     *    watchId, terminate this algorithm.
     */
    /* v8 ignore start: hard to reproduce this race condition */
    if (typeof watchId === "number" && !this.#watchIds.includes(watchId)) {
      return;
    }
    /* v8 ignore stop */

    /*
     * 2. Let acquisitionTime be a new EpochTimeStamp that represents now.
     */
    const acquisitionTime = Date.now();

    /*
     * 3. Let timeoutTime be the sum of acquisitionTime and options.timeout.
     */
    const timeoutTime = acquisitionTime + options.timeout;

    /*
     * 4. Let cachedPosition be this's [[cachedPosition]].
     */
    const cachedPosition = this.#cachedPosition;

    /*
     * 5. Create an implementation-specific timeout task that elapses at
     *    timeoutTime, during which it tries to acquire the device's position by
     *    running the following steps:
     */

    const timeoutDelay = timeoutTime - acquisitionTime;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let timeoutTask: Promise<never> | undefined;

    if (Number.isFinite(timeoutDelay)) {
      timeoutTask = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          reject(GeolocationPositionError.TIMEOUT);
        }, timeoutDelay);
      });
    }

    const workTask: Promise<GeolocationPosition> = (async () => {
      /*
       * 5. (cont.)
       *    1. Let permission be get the current permission state of
       *       "geolocation".
       */
      const hasAccess = this.#permissionStore.hasAccess(descriptor);

      /*
       * 5. (cont.)
       *    2. If permission is "denied":
       */
      if (!hasAccess) {
        /*
         * 5. (cont.)
         *    2. (cont.)
         *       1. Stop timeout.
         */
        clearTimeout(timeoutId);

        /*
         * 5. (cont.)
         *    2. (cont.)
         *       2. Do the user or system denied permission failure case step.
         */

        throw GeolocationPositionError.PERMISSION_DENIED;
      }

      /*
       * 5. (cont.)
       *    3. If permission is "granted":
       *       1. Let position be null.
       */
      let position: GeolocationPosition | null = null;

      /*
       * 5. (cont.)
       *    3. (cont.)
       *       2. If cachedPosition is not null, and options.maximumAge is
       *          greater than 0:
       */
      if (cachedPosition != null && options.maximumAge > 0) {
        /*
         * 5. (cont.)
         *    3. (cont.)
         *       2. (cont.)
         *          1. Let cacheTime be acquisitionTime minus the value of the
         *             options.maximumAge member.
         */
        const cacheTime = acquisitionTime - options.maximumAge;

        /*
         * 5. (cont.)
         *    3. (cont.)
         *       2. (cont.)
         *          2. If cachedPosition's timestamp's value is greater than
         *             cacheTime, and cachedPosition.[[isHighAccuracy]] equals
         *             options.enableHighAccuracy, set position to
         *             cachedPosition.
         */
        //
        // We deviate from the spec here in how we handle accuracy, because no
        // browser follows the spec. This behavior matches Firefox because it
        // seems the most reasonable.
        //
        // We also use >= instead of > because it seems to match the definition
        // of "maximum age" better, but in practice you would never notice the
        // 1ms difference.
        if (
          cachedPosition.timestamp >= cacheTime &&
          (!options.enableHighAccuracy || isHighAccuracy(cachedPosition))
        ) {
          position = cachedPosition;
        }
      }

      /*
       * 5. (cont.)
       *    3. (cont.)
       *       3. Otherwise, if position is not cachedPosition, try to acquire
       *          position data from the underlying system, optionally taking
       *          into consideration the value of options.enableHighAccuracy
       *          during acquisition.
       */
      if (!position) {
        const coords = await Promise.race([
          (async () => {
            try {
              return await this.#locationServices.acquireCoordinates(
                options.enableHighAccuracy,
              );
            } catch {
              /*
               * 5. (cont.)
               *    3. (cont.)
               *       4. If the timeout elapses during acquisition, or acquiring
               *          the device's position results in failure:
               *          1. Stop the timeout.
               */
              clearTimeout(timeoutId);

              /*
               * 5. (cont.)
               *    3. (cont.)
               *       4. (cont.)
               *          2. Go to dealing with failures.
               *          3. Terminate this algorithm.
               */

              throw GeolocationPositionError.POSITION_UNAVAILABLE;
            }
          })(),

          new Promise<never>((_resolve, reject) => {
            const unsubscribePermission = this.#permissionStore.subscribe(
              (descriptor, { hasAccess }) => {
                if (descriptor.name !== "geolocation" || hasAccess) return;

                reject(GeolocationPositionError.PERMISSION_DENIED);
                unsubscribePermission();
              },
            );
          }),
        ]);

        /*
         * 5. (cont.)
         *    3. (cont.)
         *       5. If acquiring the position data from the system succeeds:
         *          1. Set position be a new GeolocationPosition passing
         *             acquisitionTime and options.enableHighAccuracy.
         */
        position = createPosition(
          coords,
          acquisitionTime,
          options.enableHighAccuracy,
        );
      }

      /*
       * 5. (cont.)
       *    3. (cont.)
       *       5. (cont.)
       *          2. Set this's [[cachedPosition]] to position.
       */
      this.#cachedPosition = position;

      /*
       * 5. (cont.)
       *    3. (cont.)
       *       6. Stop the timeout.
       */
      clearTimeout(timeoutId);

      /*
       * 5. (cont.)
       *    3. (cont.)
       *       7. Queue a task on the geolocation task source with a step that
       *          invokes successCallback with position.
       */
      return position;
    })();

    const tasks = [workTask];
    if (timeoutTask) tasks.push(timeoutTask);

    try {
      const position = await Promise.race(tasks);

      /* v8 ignore start: hard to reproduce this race condition */
      if (typeof watchId === "number" && !this.#watchIds.includes(watchId)) {
        return;
      }
      /* v8 ignore stop */

      this.#invokeSuccessCallback(successCallback, position);
    } catch (condition) {
      /* v8 ignore start: hard to reproduce this race condition */
      if (typeof watchId === "number" && !this.#watchIds.includes(watchId)) {
        return;
      }
      /* v8 ignore stop */

      /*
       * Dealing with failures:
       *
       * If acquiring a position fails, do one of the following based on the
       * condition that matches the failure:
       */
      if (condition === GeolocationPositionError.PERMISSION_DENIED) {
        /*
         * - User or system denied permission:
         *   - Call back with error passing errorCallback and PERMISSION_DENIED.
         */
        /* v8 ignore start: difficult to test cases with no error callback */
        this.#invokeErrorCallback(
          errorCallback,
          createPermissionDeniedError(""),
        );
        /* v8 ignore stop */
      } else if (condition === GeolocationPositionError.TIMEOUT) {
        /*
         * - Timeout elapsed:
         *   - Call back with error with errorCallback and TIMEOUT.
         */
        /* v8 ignore start: difficult to test cases with no error callback */
        this.#invokeErrorCallback(errorCallback, createTimeoutError(""));
        /* v8 ignore stop */
      } else {
        /*
         * Data acquisition error or any other reason:
         * - Call back with error passing errorCallback and
         *   POSITION_UNAVAILABLE.
         */
        /* v8 ignore start: difficult to test cases with no error callback */
        this.#invokeErrorCallback(
          errorCallback,
          createPositionUnavailableError(""),
        );
        /* v8 ignore stop */
      }
    }
  }

  #removeWatchId(watchIds: number[], watchId: number): void {
    const watchIdIndex = watchIds.indexOf(watchId);

    /* v8 ignore start: hard to reproduce this race condition */
    if (watchIdIndex === -1) return;
    /* v8 ignore stop */

    watchIds.splice(watchIdIndex, 1);

    this.#watchControllers[watchId]?.abort();
    delete this.#watchControllers[watchId];
  }

  #invokeSuccessCallback(
    successCallback: PositionCallback,
    position: GeolocationPosition,
  ): void {
    try {
      successCallback(position);
      /* v8 ignore start: impossible to test under Vitest */
    } catch (error) {
      // Throw callback errors asynchronously, so that users will at least see
      // it in the console and notice that their success callback throws.
      queueMicrotask(() => {
        throw error;
      });
    }
    /* v8 ignore stop */
  }

  #invokeErrorCallback(
    errorCallback: PositionErrorCallback | undefined,
    error: globalThis.GeolocationPositionError,
  ): void {
    try {
      errorCallback?.(error);
      /* v8 ignore start: impossible to test under Vitest */
    } catch (error) {
      // Throw callback errors asynchronously, so that users will at least see
      // it in the console and notice that their error callback throws.
      queueMicrotask(() => {
        throw error;
      });
    }
    /* v8 ignore stop */
  }

  #locationServices: LocationServices;
  #permissionStore: PermissionStore;
  #cachedPosition: GeolocationPosition | null;
  #watchIds: number[];
  #watchControllers: Record<number, AbortController>;
  #watchId: number;
}
