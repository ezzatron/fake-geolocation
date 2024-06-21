let canConstruct = false;

export function createCoordinates(
  coords: Partial<globalThis.GeolocationCoordinates> = {},
): globalThis.GeolocationCoordinates {
  canConstruct = true;

  return new GeolocationCoordinates({
    latitude: 0,
    longitude: 0,
    altitude: null,
    accuracy: 0,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    ...coords,
  });
}

export class GeolocationCoordinates {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude: number | null;
  readonly accuracy: number;
  readonly altitudeAccuracy: number | null;
  readonly heading: number | null;
  readonly speed: number | null;

  constructor(coords: globalThis.GeolocationCoordinates) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.latitude = coords.latitude;
    this.longitude = coords.longitude;
    this.altitude = coords.altitude;
    this.accuracy = coords.accuracy;
    this.altitudeAccuracy = coords.altitudeAccuracy;
    this.heading = coords.heading;
    this.speed = coords.speed;
  }

  readonly [Symbol.toStringTag] = "GeolocationCoordinates";
}
