import { createPositionUnavailableError } from "./geolocation-position-error.js";
import { GeolocationStore } from "./geolocation-store.js";
import {
  StdGeolocation,
  StdPositionCallback,
  StdPositionErrorCallback,
} from "./types/std.js";

export class Geolocation {
  constructor({ geolocationStore }: { geolocationStore: GeolocationStore }) {
    this.#geolocationStore = geolocationStore;
  }

  getCurrentPosition(
    successFn: StdPositionCallback,
    errorFn?: StdPositionErrorCallback | null,
  ): void {
    const position = this.#geolocationStore.get();

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

  #geolocationStore: GeolocationStore;
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;
