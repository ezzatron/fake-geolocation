import { sleep } from "./async.js";
import { createPositionUnavailableError } from "./geolocation-position-error.js";
import { createPosition } from "./geolocation-position.js";
import { StdGeolocationPosition } from "./types/std.js";

export interface LocationServices {
  getPosition(): Promise<StdGeolocationPosition>;
  setPosition(position: StdGeolocationPosition | undefined): void;
}

export function createLocationServices(): LocationServices {
  let position: StdGeolocationPosition | undefined;

  return {
    async getPosition() {
      // systems should not rely on the position being available immediately
      await sleep(0);

      if (position) return position;
      throw createPositionUnavailableError("");
    },

    setPosition(nextPosition) {
      position = nextPosition && createPosition(nextPosition);
    },
  };
}
