import { HandlePermissionRequest } from "fake-permissions";
import {
  GeolocationPositionError,
  createPermissionDeniedError,
  createPositionUnavailableError,
  createTimeoutError,
} from "./geolocation-position-error.js";
import { createPosition, isHighAccuracy } from "./geolocation-position.js";
import { LocationServices, Unsubscribe } from "./location-services.js";

type GeolocationParameters = {
  locationServices: LocationServices;
  permissions: Permissions;
  requestPermission: HandlePermissionRequest;
};

let canConstruct = false;

export function createGeolocation(
  parameters: GeolocationParameters,
): globalThis.Geolocation {
  canConstruct = true;

  return new Geolocation(parameters);
}

export class Geolocation {
  constructor({
    locationServices,
    permissions,
    requestPermission,
  }: GeolocationParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#locationServices = locationServices;
    this.#permissions = permissions;
    this.#requestPermission = requestPermission;
    this.#cachedPosition = null;
    this.#watchIds = [];
    this.#watchUnsubscribers = {};
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
      /* istanbul ignore next: promise failsafe, can't occur normally */
      () => {},
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
      /* istanbul ignore next: promise failsafe, can't occur normally */
      () => {},
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
    const descriptor: PermissionDescriptor = {
      name: "geolocation",
    };

    /*
     * 6. Set permission to request permission to use descriptor.
     */
    await this.#requestPermission(descriptor);
    const permission = await this.#permissions.query(descriptor);

    /*
     * 7. If permission is "denied", then:
     */
    if (permission.state === "denied") {
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
    const unsubscribe = this.#locationServices.subscribe((isHighAccuracy) => {
      if (isHighAccuracy !== options.enableHighAccuracy) return;

      this.#acquirePosition(
        successCallback,
        errorCallback,
        options,
        watchId,
      ).catch(
        /* istanbul ignore next: promise failsafe, can't occur normally */
        () => {},
      );
    });
    const onPermissionChange = () => {
      if (permission.state === "granted") {
        this.#acquirePosition(
          successCallback,
          errorCallback,
          options,
          watchId,
        ).catch(
          /* istanbul ignore next: promise failsafe, can't occur normally */
          () => {},
        );
      } else {
        /* istanbul ignore next: difficult to test cases with no error callback */
        this.#invokeErrorCallback(
          errorCallback,
          createPermissionDeniedError(""),
        );
      }
    };
    permission.addEventListener("change", onPermissionChange);
    this.#watchUnsubscribers[watchId] = () => {
      permission.removeEventListener("change", onPermissionChange);
      unsubscribe();
    };
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
    /* istanbul ignore next: hard to reproduce this race condition */
    if (typeof watchId === "number" && !this.#watchIds.includes(watchId)) {
      return;
    }

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
      const permission = await this.#permissions.query({ name: "geolocation" });

      /*
       * 5. (cont.)
       *    2. If permission is "denied":
       */
      if (permission.state !== "granted") {
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
            function onPermissionChange() {
              /* istanbul ignore next: can't change from "granted" to "granted" */
              if (permission.state === "granted") return;

              reject(GeolocationPositionError.PERMISSION_DENIED);
              permission.removeEventListener("change", onPermissionChange);
            }
            permission.addEventListener("change", onPermissionChange);
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

      /* istanbul ignore next: hard to reproduce this race condition */
      if (typeof watchId === "number" && !this.#watchIds.includes(watchId)) {
        return;
      }

      this.#invokeSuccessCallback(successCallback, position);
    } catch (condition) {
      /* istanbul ignore next: hard to reproduce this race condition */
      if (typeof watchId === "number" && !this.#watchIds.includes(watchId)) {
        return;
      }

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
        /* istanbul ignore next: difficult to test cases with no error callback */
        this.#invokeErrorCallback(
          errorCallback,
          createPermissionDeniedError(""),
        );
      } else if (condition === GeolocationPositionError.TIMEOUT) {
        /*
         * - Timeout elapsed:
         *   - Call back with error with errorCallback and TIMEOUT.
         */
        /* istanbul ignore next: difficult to test cases with no error callback */
        this.#invokeErrorCallback(errorCallback, createTimeoutError(""));
      } else {
        /*
         * Data acquisition error or any other reason:
         * - Call back with error passing errorCallback and
         *   POSITION_UNAVAILABLE.
         */
        /* istanbul ignore next: difficult to test cases with no error callback */
        this.#invokeErrorCallback(
          errorCallback,
          createPositionUnavailableError(""),
        );
      }
    }
  }

  #removeWatchId(watchIds: number[], watchId: number): void {
    const watchIdIndex = watchIds.indexOf(watchId);

    /* istanbul ignore next: hard to reproduce this race condition */
    if (watchIdIndex === -1) return;

    watchIds.splice(watchIdIndex, 1);

    this.#watchUnsubscribers[watchId]?.();
    delete this.#watchUnsubscribers[watchId];
  }

  #invokeSuccessCallback(
    successCallback: PositionCallback,
    position: GeolocationPosition,
  ): void {
    try {
      successCallback(position);
    } catch (error) {
      // Throw callback errors asynchronously, so that users will at least see
      // it in the console and notice that their success callback throws.
      setTimeout(() => {
        throw error;
      }, 0);
    }
  }

  #invokeErrorCallback(
    errorCallback: PositionErrorCallback | undefined,
    error: globalThis.GeolocationPositionError,
  ): void {
    try {
      errorCallback?.(error);
    } catch (error) {
      // Throw callback errors asynchronously, so that users will at least see
      // it in the console and notice that their error callback throws.
      setTimeout(() => {
        throw error;
      }, 0);
    }
  }

  #locationServices: LocationServices;
  #permissions: Permissions;
  #requestPermission: HandlePermissionRequest;
  #cachedPosition: GeolocationPosition | null;
  #watchIds: number[];
  #watchUnsubscribers: Record<number, Unsubscribe>;
  #watchId: number;
}
