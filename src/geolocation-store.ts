export interface GeolocationStore {
  get(): GeolocationPosition | undefined;
  set(position: GeolocationPosition | undefined): void;
}

export function createGeolocationStore(): GeolocationStore {
  let position: GeolocationPosition | undefined;

  return {
    get() {
      return position;
    },

    set(nextPosition) {
      position = nextPosition;
    },
  };
}
