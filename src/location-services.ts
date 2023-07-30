import { sleep } from "./async.js";
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
      throw new Error("Position unavailable");
    },

    setPosition(nextPosition) {
      position = nextPosition;
    },
  };
}
