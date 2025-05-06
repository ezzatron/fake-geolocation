import {
  User as PermissionsUser,
  createUser as createPermissionsUser,
  type UserParameters as PermissionsUserParameters,
} from "fake-permissions";
import {
  createCoordinates,
  type GeolocationCoordinatesParameters,
} from "./geolocation-coordinates.js";
import { MutableLocationServices } from "./location-services.js";

/**
 * A virtual user that can affect geolocation and permissions.
 */
export interface User extends PermissionsUser {
  /**
   * Enable location services.
   *
   * This is equivalent to enabling location services at the device, operating
   * system, or browser level.
   */
  enableLocationServices: () => void;

  /**
   * Disable location services.
   *
   * This is equivalent to disabling location services at the device, operating
   * system, or browser level.
   *
   * When location services are disabled, the {@link Geolocation} API will
   * produce {@link GeolocationPositionError} errors with the code
   * {@link GeolocationPositionError.code | `2` (position unavailable)}.
   */
  disableLocationServices: () => void;

  /**
   * Jump to the given coordinates.
   *
   * This will cause an immediate update to both high and low accuracy
   * coordinates, which will be reflected via the fake {@link Geolocation} API
   * in subsequent position retrievals, and will also cause calls to any active
   * position watch callbacks.
   *
   * The supplied parameters will first be passed to the user's
   * {@link UserParameters.createCoordinates} function to create the high
   * accuracy coordinates. The low accuracy coordinates will then be created by
   * passing the high accuracy coordinates to the user's
   * {@link UserParameters.lowAccuracyTransform} function.
   *
   * @param coordsParams The parameters of the high accuracy coordinates to jump
   *   to.
   *
   * @inlineType GeolocationCoordinatesParameters
   */
  jumpToCoordinates: (
    coordsParams: Partial<GeolocationCoordinatesParameters>,
  ) => void;
}

/**
 * Parameters for creating a virtual user.
 *
 * @see {@link createUser} to create a virtual user.
 */
export interface UserParameters extends PermissionsUserParameters {
  /**
   * A factory function to create coordinates objects.
   *
   * @param params - The parameters to use.
   *
   * @returns The coordinates object.
   *
   * @defaultValue A function that behaves like {@link createCoordinates},
   *   except that `accuracy` defaults to 10 meters.
   *
   * @inlineType GeolocationCoordinatesParameters
   */
  createCoordinates?: (
    params: Partial<GeolocationCoordinatesParameters>,
  ) => GeolocationCoordinates;

  /**
   * The location services to use.
   */
  locationServices: MutableLocationServices;

  /**
   * A function to transform high accuracy coordinates to low accuracy
   * coordinates.
   *
   * @param coords - The high accuracy coordinates.
   *
   * @returns The low accuracy coordinates.
   *
   * @defaultValue (coords) => coords
   */
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
}

/**
 * Create a virtual user that can affect geolocation and permissions.
 *
 * @param params - The parameters for creating the user.
 *
 * @returns A virtual user.
 *
 * @inlineType UserParameters
 */
export function createUser(params: UserParameters): User {
  const {
    createCoordinates: createCoordinatesFn = ({
      latitude = 0,
      longitude = 0,
      altitude = null,
      accuracy = 10,
      altitudeAccuracy = null,
      heading = null,
      speed = null,
    }) =>
      createCoordinates({
        latitude,
        longitude,
        altitude,
        accuracy,
        altitudeAccuracy,
        heading,
        speed,
      }),
    locationServices,
    lowAccuracyTransform = (coords) => coords,
    ...permissionsParams
  } = params;

  return {
    ...createPermissionsUser(permissionsParams),

    enableLocationServices() {
      locationServices.enable();
    },

    disableLocationServices() {
      locationServices.disable();
    },

    jumpToCoordinates(coordsParams) {
      const coords = createCoordinatesFn(coordsParams);

      locationServices.setHighAccuracyCoordinates(coords);
      locationServices.setLowAccuracyCoordinates(lowAccuracyTransform(coords));
    },
  };
}
