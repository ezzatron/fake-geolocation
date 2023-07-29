import { StdGeolocation } from "./types/std.js";

export class Geolocation {
  getCurrentPosition(successFn: PositionCallback): void {
    successFn({
      coords: {
        latitude: 40.71703581534977,
        longitude: -74.03457283319447,
        accuracy: 25.019,
        altitude: 22.27227783203125,
        altitudeAccuracy: 9.838127136230469,
        heading: null,
        speed: null,
      },
      timestamp: 1687923355537,
    });
  }

  watchPosition(): number {
    throw new Error("Method not implemented.");
  }

  clearWatch(): void {
    throw new Error("Method not implemented clearWatch");
  }
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;
