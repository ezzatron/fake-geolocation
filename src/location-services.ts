import { sleep } from "./async.js";
import { createCoordinates } from "./geolocation-coordinates.js";
import type { createUser, User } from "./user.js";

export type _DocsTypes = typeof createUser | User;

/**
 * A virtual location services API that fake {@link Geolocation} APIs can use to
 * acquire the coordinates, and subscribe changes in the coordinates.
 */
export interface LocationServices {
  /**
   * Whether the location services are enabled.
   */
  readonly isEnabled: boolean;

  /**
   * Acquire the coordinates.
   *
   * @param enableHighAccuracy - Whether to acquire high accuracy coordinates.
   *
   * @returns The coordinates.
   * @throws An {@link Error} if the location services are disabled, or if the
   *   coordinates are unavailable.
   */
  acquireCoordinates: (
    enableHighAccuracy: boolean,
  ) => Promise<GeolocationCoordinates>;

  /**
   * Subscribe to changes in the coordinates.
   *
   * @param subscriber - A subscriber function that will be called when the
   *   coordinates change.
   *
   * @returns A function to unsubscribe the subscriber.
   */
  subscribe: (subscriber: LocationServicesSubscriber) => () => void;
}

/**
 * A function that is called when the location services coordinates change.
 *
 * The function will be called separately for high accuracy and low accuracy
 * coordinates. The actual coordinates are not supplied to the function. To read
 * the new coordinates, use {@link LocationServices.acquireCoordinates}.
 *
 * @param isHighAccuracy - Whether the coordinates are high accuracy.
 */
export type LocationServicesSubscriber = (isHighAccuracy: boolean) => void;

/**
 * A mutable virtual location services API that virtual users can use to
 * manipulate the location services status and coordinates.
 *
 * @see {@link createUser} for how to supply this to a virtual user.
 *
 * @expandType LocationServices
 */
export interface MutableLocationServices extends LocationServices {
  /**
   * Enable the location services.
   *
   * @see {@link User.enableLocationServices}
   */
  enable: () => void;

  /**
   * Disable the location services.
   *
   * @see {@link User.disableLocationServices}
   */
  disable: () => void;

  /**
   * Set the high accuracy coordinates.
   *
   * @param coords - The high accuracy coordinates.
   */
  setHighAccuracyCoordinates: (
    coords: GeolocationCoordinates | undefined,
  ) => void;

  /**
   * Set the low accuracy coordinates.
   *
   * @param coords - The low accuracy coordinates.
   */
  setLowAccuracyCoordinates: (
    coords: GeolocationCoordinates | undefined,
  ) => void;
}

/**
 * Parameters for creating a virtual location services API.
 *
 * @see {@link createLocationServices} to create a virtual location services
 *   API.
 */
export interface LocationServicesParameters {
  /**
   * An optional delay in milliseconds to wait for all coordinates to be
   * acquired.
   *
   * If a number is provided, all calls to
   * {@link LocationServices.acquireCoordinates} will wait for this number of
   * milliseconds via {@link setTimeout} before returning the coordinates. If
   * omitted, no timeout will be used.
   *
   * This is useful for simulating a delay in acquiring coordinates, which in
   * the real world never happens instantly. Adding a delay can make your tests
   * more realistic, but can result in slower tests, and introduce issues when
   * fake timers are used.
   *
   * @defaultValue `undefined`
   */
  acquireDelay?: number;
}

/**
 * Create a virtual location services API.
 *
 * @param params - The parameters for creating the virtual location services
 *   API.
 *
 * @returns A virtual location services API.
 *
 * @inlineType LocationServicesParameters
 */
export function createLocationServices(
  params: LocationServicesParameters = {},
): MutableLocationServices {
  const { acquireDelay } = params;
  const subscribers = new Set<LocationServicesSubscriber>();
  let isEnabled = true;
  let highAccuracyCoords: GeolocationCoordinates | undefined;
  let lowAccuracyCoords: GeolocationCoordinates | undefined;

  return {
    get isEnabled() {
      return isEnabled;
    },

    enable() {
      isEnabled = true;
      dispatch(true);
      dispatch(false);
    },

    disable() {
      isEnabled = false;
      dispatch(true);
      dispatch(false);
    },

    async acquireCoordinates(enableHighAccuracy) {
      if (isEnabled) {
        if (acquireDelay != null) await sleep(acquireDelay);

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
        /* v8 ignore start: impossible to test under Vitest -- @preserve */
      } catch (error) {
        // Throw subscriber errors asynchronously, so that users will at least
        // see it in the console and notice that their subscriber throws.
        queueMicrotask(() => {
          throw error;
        });
      }
      /* v8 ignore stop -- @preserve */
    }
  }
}
