import type { GeolocationCoordinatesParameters } from "./geolocation-coordinates.js";
import { createCoordinates } from "./geolocation-coordinates.js";

export type GeolocationPositionParameters = {
  coords: GeolocationCoordinatesParameters;
} & Pick<globalThis.GeolocationPosition, "timestamp">;

const internal = new WeakMap<
  globalThis.GeolocationPosition,
  { isHighAccuracy: boolean }
>();

let canConstruct = false;

export function createPosition(
  coords: Partial<GeolocationCoordinates> = {},
  timestamp: number = 0,
  isHighAccuracy: boolean = true,
): globalThis.GeolocationPosition {
  canConstruct = true;

  const position = new GeolocationPosition(
    createCoordinates(coords),
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
