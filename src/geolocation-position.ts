import type { GeolocationCoordinatesParameters } from "./geolocation-coordinates.js";
import { createCoordinates } from "./geolocation-coordinates.js";

/**
 * Parameters for creating a
 * {@link globalThis.GeolocationPosition | GeolocationPosition} object.
 *
 * @interface
 *
 * @property coords - Parameters for creating a {@link GeolocationCoordinates}
 *   object.
 *
 * @property timestamp - A timestamp, given as Unix time in milliseconds,
 *   representing the time at which the location was retrieved.
 *
 *   See
 *   {@link globalThis.GeolocationPosition | GeolocationPosition.timestamp}
 */
export type GeolocationPositionParameters = Omit<
  globalThis.GeolocationPosition,
  "coords" | "toJSON"
> & {
  coords: GeolocationCoordinatesParameters;
};

const internal = new WeakMap<
  globalThis.GeolocationPosition,
  { isHighAccuracy: boolean }
>();

let canConstruct = false;

/**
 * Create a fake W3C
 * {@link globalThis.GeolocationPosition | GeolocationPosition} object.
 *
 * @param coordsParams - The coordinates to use.
 * @param timestamp - The timestamp to use.
 * @param isHighAccuracy - Whether the position should be considered "high
 *   accuracy".
 *
 * @returns The
 *   {@link globalThis.GeolocationPosition | GeolocationPosition} object.
 *
 * @inlineType GeolocationCoordinatesParameters
 */
export function createPosition(
  coordsParams: Partial<GeolocationCoordinatesParameters> = {},
  timestamp: number = 0,
  isHighAccuracy: boolean = true,
): globalThis.GeolocationPosition {
  canConstruct = true;

  const position = new GeolocationPosition(
    createCoordinates(coordsParams),
    timestamp,
  );
  internal.set(position, { isHighAccuracy });

  return position;
}

export class GeolocationPosition {
  readonly coords: GeolocationCoordinates;
  readonly timestamp: number;

  constructor(coords: GeolocationCoordinates, timestamp: number) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.coords = coords;
    this.timestamp = timestamp;
  }

  toJSON() {
    return {
      coords: this.coords.toJSON() as object,
      timestamp: this.timestamp,
    };
  }

  readonly [Symbol.toStringTag] = "GeolocationPosition";
}

export function isHighAccuracy(position: globalThis.GeolocationPosition) {
  const slots = internal.get(position);

  /* v8 ignore start: internal function, can't occur normally  */
  if (!slots) throw new TypeError("Unknown position instance");
  /* v8 ignore stop */

  return slots.isHighAccuracy;
}
