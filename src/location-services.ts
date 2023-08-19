import { sleep } from "./async.js";
import { createCoordinates } from "./geolocation-coordinates.js";
import { StdGeolocationCoordinates } from "./types/std.js";

export interface LocationServices {
  acquireCoordinates(
    enableHighAccuracy: boolean,
  ): Promise<StdGeolocationCoordinates>;
}

export interface MutableLocationServices extends LocationServices {
  setCoordinates(coords: StdGeolocationCoordinates | undefined): void;
}

export function createLocationServices({
  acquireDelay = 0,
}: { acquireDelay?: number } = {}): MutableLocationServices {
  let coords: StdGeolocationCoordinates | undefined;

  return {
    async acquireCoordinates() {
      await sleep(acquireDelay);

      if (coords) return coords;
      throw new Error("Unable to acquire coordinates");
    },

    setCoordinates(nextCoords) {
      coords = nextCoords && createCoordinates(nextCoords);
    },
  };
}
