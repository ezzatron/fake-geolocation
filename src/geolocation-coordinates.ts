let canConstruct = false;

/**
 * Parameters for creating a {@link @types/web!GeolocationCoordinates} object.
 */
export type GeolocationCoordinatesParameters = Omit<
  globalThis.GeolocationCoordinates,
  "toJSON"
>;

/**
 * Create a fake W3C {@link @types/web!GeolocationCoordinates} object.
 *
 * @param params - The parameters to use.
 *
 * @returns The coordinates object.
 */
export function createCoordinates(
  params: Partial<GeolocationCoordinatesParameters> = {},
): globalThis.GeolocationCoordinates {
  const {
    latitude = 0,
    longitude = 0,
    altitude = null,
    accuracy = 0,
    altitudeAccuracy = null,
    heading = null,
    speed = null,
  } = params;

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
