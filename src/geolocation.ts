import { createPositionUnavailableError } from "./geolocation-position-error.js";
import { LocationServices } from "./location-services.js";
import {
  StdGeolocation,
  StdPositionCallback,
  StdPositionErrorCallback,
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
  ): void {
    (async () => {
      successFn(await this.#locationServices.getPosition());
    })().catch(() => {
      errorFn?.(createPositionUnavailableError());
    });
  }

  watchPosition(): number {
    throw new Error("Method not implemented.");
  }

  clearWatch(): void {
    throw new Error("Method not implemented clearWatch");
  }

  #locationServices: LocationServices;
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;
