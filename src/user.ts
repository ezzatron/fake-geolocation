import {
  PermissionStore,
  User as PermissionsUser,
  createUser as createPermissionsUser,
  type HandleAccessRequest,
} from "fake-permissions";
import {
  createCoordinates,
  type GeolocationCoordinatesParameters,
} from "./geolocation-coordinates.js";
import { MutableLocationServices } from "./location-services.js";

export interface User extends PermissionsUser {
  enableLocationServices(): void;
  disableLocationServices(): void;
  jumpToCoordinates(coords: Partial<GeolocationCoordinates>): void;
}

export function createUser({
  handleAccessRequest,
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
  permissionStore,
}: {
  handleAccessRequest?: HandleAccessRequest;
  locationServices: MutableLocationServices;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
  normalizeCoordinates?: (
    coords: Partial<GeolocationCoordinatesParameters>,
  ) => GeolocationCoordinates;
  permissionStore: PermissionStore;
}): User {
  return {
    ...createPermissionsUser({ permissionStore, handleAccessRequest }),

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
