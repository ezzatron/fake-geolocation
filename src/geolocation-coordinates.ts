let canConstruct = false;

export type GeolocationCoordinatesParameters = {
  latitude: typeof globalThis.GeolocationCoordinates.prototype.latitude;
  longitude: typeof globalThis.GeolocationCoordinates.prototype.longitude;
  altitude: typeof globalThis.GeolocationCoordinates.prototype.altitude;
  accuracy: typeof globalThis.GeolocationCoordinates.prototype.accuracy;
  altitudeAccuracy: typeof globalThis.GeolocationCoordinates.prototype.altitudeAccuracy;
  heading: typeof globalThis.GeolocationCoordinates.prototype.heading;
  speed: typeof globalThis.GeolocationCoordinates.prototype.speed;
};

export function createCoordinates({
  latitude = 0,
  longitude = 0,
  altitude = null,
  accuracy = 0,
  altitudeAccuracy = null,
  heading = null,
  speed = null,
}: Partial<GeolocationCoordinatesParameters> = {}): globalThis.GeolocationCoordinates {
  canConstruct = true;

  return new GeolocationCoordinates({
    latitude,
    longitude,
    altitude,
    accuracy,
    altitudeAccuracy,
    heading,
    speed,
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

  constructor(coords: GeolocationCoordinatesParameters) {
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

  toJSON() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      accuracy: this.accuracy,
      altitudeAccuracy: this.altitudeAccuracy,
      heading: this.heading,
      speed: this.speed,
    };
  }

  readonly [Symbol.toStringTag] = "GeolocationCoordinates";
}
