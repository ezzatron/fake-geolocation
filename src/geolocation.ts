import { errorMessage } from "./error.js";
import {
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
    successFn: StdPositionCallback,
    errorFn?: StdPositionErrorCallback | null,
    options?: StdPositionOptions | null,
  ): void {
    this.#getCurrentPosition(options ?? {})
      .then((position) => successFn(position))
      .catch((error) => {
        if (!errorFn) return;

        if (isGeolocationPositionError(error)) {
          errorFn(error);
        } else {
          errorFn(
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

  async #getCurrentPosition({
    timeout = Infinity,
  }: StdPositionOptions): Promise<StdGeolocationPosition> {
    if (!Number.isFinite(timeout)) return this.#locationServices.getPosition();

    timeout = timeout < 0 ? 0 : timeout;

    return Promise.race([
      this.#timeout(AbortSignal.timeout(timeout)),
      this.#locationServices.getPosition(),
    ]);
  }

  #timeout(signal: AbortSignal): Promise<never> {
    return new Promise((_resolve, reject) => {
      /* istanbul ignore next */
      if (signal.aborted) {
        reject(createTimeoutError("Timeout expired"));

        return;
      }

      signal.addEventListener(
        "abort",
        () => {
          reject(createTimeoutError("Timeout expired"));
        },
        { once: true },
      );
    });
  }

  #locationServices: LocationServices;
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;
