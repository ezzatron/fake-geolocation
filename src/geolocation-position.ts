import { createCoordinates } from "./geolocation-coordinates.js";
import {
  StdGeolocationCoordinates,
  StdGeolocationPosition,
} from "./types/std.js";

const IS_HIGH_ACCURACY = Symbol("isHighAccuracy");
let canConstruct = false;

export function createPosition(
  coords: StdGeolocationCoordinates,
  timestamp: number,
  isHighAccuracy: boolean,
): StdGeolocationPosition {
  canConstruct = true;

  return new GeolocationPosition(
    createCoordinates(coords),
    timestamp,
    isHighAccuracy,
  );
}

export class GeolocationPosition {
  readonly coords: StdGeolocationCoordinates;
  readonly timestamp: number;
  readonly [IS_HIGH_ACCURACY]: boolean;

  constructor(
    coords: StdGeolocationCoordinates,
    timestamp: number,
    isHighAccuracy: boolean,
  ) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.coords = coords;
    this.timestamp = timestamp;
    this[IS_HIGH_ACCURACY] = isHighAccuracy;
  }
}

GeolocationPosition satisfies new (...args: never[]) => StdGeolocationPosition;

export function isHighAccuracy(position: StdGeolocationPosition) {
  return IS_HIGH_ACCURACY in position && position[IS_HIGH_ACCURACY];
}
