let canConstruct = false;

/**
 * Parameters for creating a
 * {@link globalThis.GeolocationCoordinates | GeolocationCoordinates} object.
 *
 * @interface
 *
 * @property accuracy - The accuracy of the `latitude` and `longitude`
 *   properties, expressed in meters.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.accuracy}
 *
 * @property altitude - The position's altitude in meters, relative to nominal
 *   sea level. This value can be `null` if the implementation cannot provide
 *   the data.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.altitude}
 *
 * @property altitudeAccuracy - The accuracy of the `altitude` expressed in
 *   meters. This value can be `null` if the implementation cannot provide the
 *   data.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.altitudeAccuracy}
 *
 * @property heading - The direction towards which the device is facing. This
 *   value, specified in degrees, indicates how far off from heading true north
 *   the device is. `0` degrees represents true north, and the direction is
 *   determined clockwise (which means that east is `90` degrees and west is
 *   `270` degrees). If `speed` is `0` or the device is unable to provide
 *   `heading` information, `heading` is `null`.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.heading}
 *
 * @property latitude - The position's latitude in decimal degrees.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.latitude}
 *
 * @property longitude - The position's longitude in decimal degrees.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.longitude}
 *
 * @property speed - The velocity of the device in meters per second. This value
 *   can be `null` if the implementation cannot provide the data.
 *
 *   See
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates.speed}
 */
export type GeolocationCoordinatesParameters = Omit<
  globalThis.GeolocationCoordinates,
  "toJSON"
>;

/**
 * Create a fake W3C
 * {@link globalThis.GeolocationCoordinates | GeolocationCoordinates} object.
 *
 * @param coordsParams - The parameters to use.
 *
 * @returns The
 *   {@link globalThis.GeolocationCoordinates | GeolocationCoordinates} object.
 *
 * @inlineType GeolocationCoordinatesParameters
 */
export function createCoordinates(
  coordsParams: Partial<GeolocationCoordinatesParameters> = {},
): globalThis.GeolocationCoordinates {
  const {
    latitude = 0,
    longitude = 0,
    altitude = null,
    accuracy = 0,
    altitudeAccuracy = null,
    heading = null,
    speed = null,
  } = coordsParams;

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
