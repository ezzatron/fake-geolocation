import { createPositionUnavailableError } from "./geolocation-position-error.js";
import { LocationServices } from "./location-services.js";
import {
  StdGeolocation,
  StdPositionCallback,
  StdPositionErrorCallback,
} from "./types/std.js";

export class Geolocation {
  constructor({ locationServices }: { locationServices: LocationServices }) {
    this.#locationServices = locationServices;
  }

  getCurrentPosition(
    successFn: StdPositionCallback,
    errorFn?: StdPositionErrorCallback | null,
  ): void {
    const position = this.#locationServices.getPosition();

    if (position) {
      successFn(position);
    } else {
      errorFn?.(createPositionUnavailableError());
    }
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
