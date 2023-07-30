import { StdGeolocationCoordinates } from "./types/std.js";

type GeolocationCoordinatesParameters = {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
};

let canConstruct = false;

export function createCoordinates(
  parameters: GeolocationCoordinatesParameters,
): StdGeolocationCoordinates {
  canConstruct = true;

  return new GeolocationCoordinates(parameters);
}

export class GeolocationCoordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly accuracy: number;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly speed: number | null;

  constructor(parameters: GeolocationCoordinatesParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.latitude = parameters.latitude;
    this.longitude = parameters.longitude;
    this.altitude = parameters.altitude;
    this.accuracy = parameters.accuracy;
    this.altitudeAccuracy = parameters.altitudeAccuracy;
    this.heading = parameters.heading;
    this.speed = parameters.speed;
  }
}

GeolocationCoordinates satisfies new (
  ...args: never[]
) => StdGeolocationCoordinates;
