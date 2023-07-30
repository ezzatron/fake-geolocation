import { createCoordinates } from "./geolocation-coordinates.js";
import {
  StdGeolocationCoordinates,
  StdGeolocationPosition,
} from "./types/std.js";

type GeolocationPositionParameters = {
  coords: StdGeolocationCoordinates;
  timestamp: number;
};

let canConstruct = false;

export function createPosition({
  coords,
  timestamp,
}: GeolocationPositionParameters): StdGeolocationPosition {
  canConstruct = true;

  return new GeolocationPosition({
    coords: createCoordinates(coords),
    timestamp,
  });
}

export class GeolocationPosition {
  readonly coords: StdGeolocationCoordinates;
  readonly timestamp: number;

  constructor(parameters: GeolocationPositionParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.coords = parameters.coords;
    this.timestamp = parameters.timestamp;
  }
}

GeolocationPosition satisfies new (...args: never[]) => StdGeolocationPosition;
