import { GeolocationStore } from "./geolocation-store.js";
import { StdGeolocation } from "./types/std.js";

export class Geolocation {
  constructor({ geolocationStore }: { geolocationStore: GeolocationStore }) {
    this.#geolocationStore = geolocationStore;
  }

  getCurrentPosition(successFn: PositionCallback): void {
    successFn(this.#geolocationStore.get()!);
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
