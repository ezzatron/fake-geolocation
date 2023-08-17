import { errorMessage } from "./error.js";
import {
  createPermissionDeniedError,
  createPositionUnavailableError,
  createTimeoutError,
  isGeolocationPositionError,
} from "./geolocation-position-error.js";
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
  }

  getCurrentPosition(
    successCallback: StdPositionCallback,
    errorCallback?: StdPositionErrorCallback | null,
    options?: StdPositionOptions | null,
  ): void {
    this.#requestPosition(options ?? {})
      .then((position) => successCallback(position))
      .catch((error) => {
        if (!errorCallback) return;

        if (isGeolocationPositionError(error)) {
          errorCallback(error);
        } else {
          errorCallback(
            createPositionUnavailableError(
              `Location services error: ${errorMessage(error)}`,
            ),
          );
        }
      });
  }

  /* istanbul ignore next */
  watchPosition(): number {
    throw new Error("Method not implemented.");
  }

  /* istanbul ignore next */
  clearWatch(): void {
    throw new Error("Method not implemented clearWatch");
  }

  /**
   * § 6.5 Request a position
   *
   * To request a position, pass a PositionCallback successCallback, a
   * PositionErrorCallback? errorCallback, PositionOptions options, and an
   * optional watchId:
   */
  async #requestPosition(
    options: StdPositionOptions,
  ): Promise<StdGeolocationPosition> {
    /*
     * 1. Let watchIDs be this's [[watchIDs]].
     */
    // TODO: implement watchPosition()

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
     *    1. If watchId was passed, remove watchId from watchIDs.
     *    2. Call back with error passing errorCallback and PERMISSION_DENIED.
     *    3. Terminate this algorithm.
     */
    if (!(await this.#locationServices.requestPermission())) {
      throw createPermissionDeniedError("");
    }

    /*
     * 8. Wait to [acquire a position] passing _successCallback_,
     *    _errorCallback_, _options_, and _watchId_.
     */
    return this.#acquirePosition(options);

    /*
     *  9. If watchId was not passed, terminate this algorithm.
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
  async #acquirePosition({
    timeout = Infinity,
  }: StdPositionOptions): Promise<StdGeolocationPosition> {
    /*
     * 1. If watchId was passed and this's [[watchIDs]] does not contain
     *    watchId, terminate this algorithm.
     * 2. Let acquisitionTime be a new EpochTimeStamp that represents now.
     */
    // TODO: implement watchPosition()
    // TODO: implement maximumAge option

    if (!Number.isFinite(timeout)) return this.#locationServices.getPosition();

    return new Promise((resolve, reject) => {
      /*
       * 3. Let timeoutTime be the sum of acquisitionTime and options.timeout.
       */
      const timeoutId = setTimeout(() => {
        reject(createTimeoutError(""));
      }, timeout);

      /*
       * 4. Let cachedPosition be this's [[cachedPosition]].
       */
      // TODO: implement maximumAge option

      /*
       * 5. Create an implementation-specific timeout task that elapses at
       *    timeoutTime, during which it tries to acquire the device's position
       *    by running the following steps:
       *    1. Let permission be get the current permission state of
       *       "geolocation".
       *    2. If permission is "denied":
       *       1. Stop timeout.
       *       2. Do the user or system denied permission failure case step.
       */
      // TODO: this might be relevant for watchPosition()

      /*
       * 5. (cont.)
       *    3. If permission is "granted":
       *       1. Let position be null.
       *       2. If cachedPosition is not null, and options.maximumAge is
       *          greater than 0:
       *          1. Let cacheTime be acquisitionTime minus the value of the
       *             options.maximumAge member.
       *          2. If cachedPosition's timestamp's value is greater than
       *             cacheTime, and cachedPosition.[[isHighAccuracy]] equals
       *             options.enableHighAccuracy, set position to cachedPosition.
       */
      // TODO: implement maximumAge option

      /*
       * 5. (cont.)
       *    3. (cont.)
       *       3. Otherwise, if position is not cachedPosition, try to acquire
       *          position data from the underlying system, optionally taking
       *          into consideration the value of options.enableHighAccuracy
       *          during acquisition.
       *       4. If the timeout elapses during acquisition, or acquiring the
       *          device's position results in failure:
       *          1. Stop the timeout.
       *          2. Go to dealing with failures.
       *          3. Terminate this algorithm.
       *       1. If acquiring the position data from the system succeeds:
       *          1. Set position be a new GeolocationPosition passing
       *             acquisitionTime and options.enableHighAccuracy.
       *          2. Set this's [[cachedPosition]] to position.
       *       6. Stop the timeout.
       *       7. Queue a task on the geolocation task source with a step that
       *          invokes successCallback with position.
       */
      this.#locationServices
        .getPosition()
        .then(resolve, reject)
        .finally(() => {
          clearTimeout(timeoutId);
        })
        .catch(
          /* istanbul ignore next */
          () => {},
        );
    });
  }

  #locationServices: LocationServices;
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;
