import { sleep } from "./async.js";
import { createCoordinates } from "./geolocation-coordinates.js";

export interface LocationServices {
  readonly isEnabled: boolean;
  acquireCoordinates(
    enableHighAccuracy: boolean,
  ): Promise<GeolocationCoordinates>;
  subscribe(subscriber: Subscriber): Unsubscribe;
}

export type Unsubscribe = () => void;
export type Subscriber = (isHighAccuracy: boolean) => void;

export interface MutableLocationServices extends LocationServices {
  enable(): void;
  disable(): void;
  setHighAccuracyCoordinates(coords: GeolocationCoordinates | undefined): void;
  setLowAccuracyCoordinates(coords: GeolocationCoordinates | undefined): void;
}

export function createLocationServices({
  acquireDelay = 0,
}: { acquireDelay?: number } = {}): MutableLocationServices {
  const subscribers = new Set<Subscriber>();
  let isEnabled = true;
  let highAccuracyCoords: GeolocationCoordinates | undefined;
  let lowAccuracyCoords: GeolocationCoordinates | undefined;

  return {
    get isEnabled() {
      return isEnabled;
    },

    enable() {
      isEnabled = true;
    },

    disable() {
      isEnabled = false;
    },

    async acquireCoordinates(enableHighAccuracy) {
      if (isEnabled) {
        await sleep(acquireDelay);

        const coords = enableHighAccuracy
          ? highAccuracyCoords
          : lowAccuracyCoords;

        if (coords) return createCoordinates(coords);
      }

      throw new Error("Unable to acquire coordinates");
    },

    setHighAccuracyCoordinates(coords) {
      highAccuracyCoords = coords && createCoordinates(coords);
      dispatch(true);
    },

    setLowAccuracyCoordinates(coords) {
      lowAccuracyCoords = coords && createCoordinates(coords);
      dispatch(false);
    },

    subscribe(subscriber) {
      subscribers.add(subscriber);

      return () => {
        subscribers.delete(subscriber);
      };
    },
  };

  function dispatch(isHighAccuracy: boolean) {
    for (const subscriber of subscribers) {
      try {
        subscriber(isHighAccuracy);
      } catch {
        // ignored
      }
    }
  }
}
