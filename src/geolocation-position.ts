import { createCoordinates } from "./geolocation-coordinates.js";
import {
  StdGeolocationCoordinates,
  StdGeolocationPosition,
} from "./types/std.js";

const internal = new WeakMap<
  GeolocationPosition,
  { isHighAccuracy: boolean }
>();

let canConstruct = false;

export function createPosition(
  coords: StdGeolocationCoordinates,
  timestamp: number,
  isHighAccuracy: boolean,
): StdGeolocationPosition {
  canConstruct = true;

  const position = new GeolocationPosition(
    createCoordinates(coords),
    timestamp,
  );
  internal.set(position, { isHighAccuracy });

  return position;
}

export class GeolocationPosition {
  readonly coords: StdGeolocationCoordinates;
  readonly timestamp: number;

  constructor(coords: StdGeolocationCoordinates, timestamp: number) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.coords = coords;
    this.timestamp = timestamp;
  }
}

GeolocationPosition satisfies new (...args: never[]) => StdGeolocationPosition;

export function isHighAccuracy(position: StdGeolocationPosition) {
  const slots = internal.get(position);

  /* istanbul ignore next */
  if (!slots) throw new TypeError("Unknown position instance");

  return slots.isHighAccuracy;
}
