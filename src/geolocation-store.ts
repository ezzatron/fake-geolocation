import { StdGeolocationPosition } from "./types/std.js";

export interface GeolocationStore {
  get(): StdGeolocationPosition | undefined;
  set(position: StdGeolocationPosition | undefined): void;
}

export function createGeolocationStore(): GeolocationStore {
  let position: StdGeolocationPosition | undefined;

  return {
    get() {
      return position;
    },

    set(nextPosition) {
      position = nextPosition;
    },
  };
}
