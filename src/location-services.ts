import { StdGeolocationPosition } from "./types/std.js";

export interface LocationServices {
  getPosition(): StdGeolocationPosition | undefined;
  setPosition(position: StdGeolocationPosition | undefined): void;
}

export function createLocationServices(): LocationServices {
  let position: StdGeolocationPosition | undefined;

  return {
    getPosition() {
      return position;
    },

    setPosition(nextPosition) {
      position = nextPosition;
    },
  };
}
