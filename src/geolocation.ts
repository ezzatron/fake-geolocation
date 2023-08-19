import { GRANTED } from "./constants/permission-state.js";
import {
  GeolocationPositionError,
  createPermissionDeniedError,
  createPositionUnavailableError,
  createTimeoutError,
} from "./geolocation-position-error.js";
import { createPosition, isHighAccuracy } from "./geolocation-position.js";
import { LocationServices } from "./location-services.js";
import {
  StdGeolocation,
  StdGeolocationPosition,
  StdPositionCallback,
  StdPositionErrorCallback,
  StdPositionOptions,
} from "./types/std.js";

type GeolocationParameters = {
  locationServices: LocationServices;
};

let canConstruct = false;

export function createGeolocation(
  parameters: GeolocationParameters,
): StdGeolocation {
  canConstruct = true;

  return new Geolocation(parameters);
}

export class Geolocation {
  constructor({ locationServices }: GeolocationParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#locationServices = locationServices;
    this.#cachedPosition = null;
    this.#watchIds = [];
  }

  /**
   * § 6.2 getCurrentPosition() method
   */
  getCurrentPosition(
    successCallback: StdPositionCallback,
    errorCallback?: StdPositionErrorCallback | null,
    options?: StdPositionOptions | null,
  ): void {
    const {
      enableHighAccuracy = false,
      maximumAge = 0,
      timeout = Infinity,
    } = options ?? {};
    const normalizedOptions: Required<StdPositionOptions> = {
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
      normalizedOptions,
    ).catch(
      /* istanbul ignore next */
      () => {},
    );
  }

  /* istanbul ignore next */
  watchPosition(): number {
    throw new Error("Not implemented");
  }

  /* istanbul ignore next */
  clearWatch(): void {
    throw new Error("Not implemented");
  }

  /**
   * § 6.5 Request a position
   *
   * To request a position, pass a PositionCallback successCallback, a
   * PositionErrorCallback? errorCallback, PositionOptions options, and an
   * optional watchId:
   */
  async #requestPosition(
    successCallback: StdPositionCallback,
    errorCallback: StdPositionErrorCallback | undefined,
    options: Required<StdPositionOptions>,
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
     * 6. Set permission to request permission to use descriptor.
     * 7. If permission is "denied", then:
     */
    if (!(await this.#locationServices.requestPermission())) {
      /*
       * 7. (cont.)
       *    1. If watchId was passed, remove watchId from watchIDs.
       */
      if (typeof watchId === "number") {
        const watchIdIndex = watchIds.indexOf(watchId);
        if (watchIdIndex !== -1) watchIds.splice(watchIdIndex, 1);
      }

      /*
       * 7. (cont.)
       *    2. Call back with error passing errorCallback and PERMISSION_DENIED.
       *    3. Terminate this algorithm.
       */
      errorCallback?.(createPermissionDeniedError(""));
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
    // TODO: implement watchPosition()
  }

  /**
   * § 6.6 Acquire a position
   *
   * To acquire a position, passing PositionCallback successCallback, a
   * PositionErrorCallback? errorCallback, PositionOptions options, and an
   * optional watchId.
   */
  async #acquirePosition(
    successCallback: StdPositionCallback,
    errorCallback: StdPositionErrorCallback | undefined,
    options: Required<StdPositionOptions>,
    watchId?: number,
  ): Promise<void> {
    /*
     * 1. If watchId was passed and this's [[watchIDs]] does not contain
     *    watchId, terminate this algorithm.
     */
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

    const workTask: Promise<StdGeolocationPosition> = (async () => {
      /*
       * 5. (cont.)
       *    1. Let permission be get the current permission state of
       *       "geolocation".
       */
      const permission = this.#locationServices.getPermissionState();

      /*
       * 5. (cont.)
       *    2. If permission is "denied":
       */
      if (permission !== GRANTED) {
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
       */
      if (permission === GRANTED) {
        /*
         * 5. (cont.)
         *    3. (cont.)
         *       1. Let position be null.
         */
        let position: StdGeolocationPosition | null = null;

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
          if (
            cachedPosition.timestamp > cacheTime &&
            isHighAccuracy(cachedPosition) === options.enableHighAccuracy
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
          const coords = await this.#locationServices.acquireCoordinates(
            options.enableHighAccuracy,
          );

          /*
           * 5. (cont.)
           *    3. (cont.)
           *       4. If the timeout elapses during acquisition, or acquiring
           *          the device's position results in failure:
           */
          if (!coords) {
            /*
             * 5. (cont.)
             *    3. (cont.)
             *       4. (cont.)
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

          /*
           * 5. (cont.)
           *    3. (cont.)
           *       5. If acquiring the position data from the system succeeds:
           */
          if (coords) {
            /*
             * 5. (cont.)
             *    3. (cont.)
             *       5. (cont.)
             *          1. Set position be a new GeolocationPosition passing
             *             acquisitionTime and options.enableHighAccuracy.
             */
            position = createPosition(
              coords,
              acquisitionTime,
              options.enableHighAccuracy,
            );
          }
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
        if (position) return position;
      }

      throw GeolocationPositionError.POSITION_UNAVAILABLE;
    })();

    const tasks = [workTask];
    if (timeoutTask) tasks.push(timeoutTask);

    try {
      successCallback(await Promise.race(tasks));
    } catch (condition) {
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
        errorCallback?.(createPermissionDeniedError(""));
      } else if (condition === GeolocationPositionError.TIMEOUT) {
        /*
         * - Timeout elapsed:
         *   - Call back with error with errorCallback and TIMEOUT.
         */
        errorCallback?.(createTimeoutError(""));
      } else {
        /*
         * Data acquisition error or any other reason:
         * - Call back with error passing errorCallback and
         *   POSITION_UNAVAILABLE.
         */
        errorCallback?.(createPositionUnavailableError(""));
      }
    }
  }

  #locationServices: LocationServices;
  #cachedPosition: GeolocationPosition | null;
  #watchIds: number[];
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;
