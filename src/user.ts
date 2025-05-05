import {
  User as PermissionsUser,
  createUser as createPermissionsUser,
  type UserParameters as PermissionsUserParameters,
} from "fake-permissions";
import { createCoordinates } from "./geolocation-coordinates.js";
import { MutableLocationServices } from "./location-services.js";

export type User = PermissionsUser & {
  enableLocationServices: () => void;
  disableLocationServices: () => void;
  jumpToCoordinates: (coords: Partial<GeolocationCoordinates>) => void;
};

/**
 * @inline
 */
export type UserParameters = PermissionsUserParameters & {
  locationServices: MutableLocationServices;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
  normalizeCoordinates?: (
    coords: Partial<GeolocationCoordinates>,
  ) => GeolocationCoordinates;
};

export function createUser(params: UserParameters): User {
  const {
    locationServices,
    lowAccuracyTransform = (coords) => coords,
    normalizeCoordinates = ({
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

    jumpToCoordinates(coords) {
      const normalized = normalizeCoordinates(coords);

      locationServices.setHighAccuracyCoordinates(normalized);
      locationServices.setLowAccuracyCoordinates(
        lowAccuracyTransform(normalized),
      );
    },
  };
}
