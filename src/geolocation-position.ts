import { createCoordinates } from "./geolocation-coordinates.js";

const internal = new WeakMap<
  globalThis.GeolocationPosition,
  { isHighAccuracy: boolean }
>();

let canConstruct = false;

export function createPosition(
  coords: Partial<globalThis.GeolocationCoordinates> = {},
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

  readonly [Symbol.toStringTag] = "GeolocationPosition";
}

export function isHighAccuracy(position: globalThis.GeolocationPosition) {
  const slots = internal.get(position);

  /* istanbul ignore next: internal function, can't occur normally  */
  if (!slots) throw new TypeError("Unknown position instance");

  return slots.isHighAccuracy;
}
