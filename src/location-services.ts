import { sleep } from "./async.js";
import { createCoordinates } from "./geolocation-coordinates.js";
import { StdGeolocationCoordinates } from "./types/std.js";

export interface LocationServices {
  acquireCoordinates(
    enableHighAccuracy: boolean,
  ): Promise<StdGeolocationCoordinates>;
}

export interface MutableLocationServices extends LocationServices {
  setHighAccuracyCoordinates(
    coords: StdGeolocationCoordinates | undefined,
  ): void;
  setLowAccuracyCoordinates(
    coords: StdGeolocationCoordinates | undefined,
  ): void;
}

export function createLocationServices({
  acquireDelay = 0,
}: { acquireDelay?: number } = {}): MutableLocationServices {
  let highAccuracyCoords: StdGeolocationCoordinates | undefined;
  let lowAccuracyCoords: StdGeolocationCoordinates | undefined;

  return {
    async acquireCoordinates(enableHighAccuracy) {
      await sleep(acquireDelay);

      const coords = enableHighAccuracy
        ? highAccuracyCoords
        : lowAccuracyCoords;

      if (coords) return createCoordinates(coords);
      throw new Error("Unable to acquire coordinates");
    },

    setHighAccuracyCoordinates(coords) {
      highAccuracyCoords = coords && createCoordinates(coords);
    },

    setLowAccuracyCoordinates(coords) {
      lowAccuracyCoords = coords && createCoordinates(coords);
    },
  };
}
