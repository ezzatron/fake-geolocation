import {
  HandlePermissionRequest,
  PermissionStore,
  User as PermissionsUser,
  createUser as createPermissionsUser,
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
  handlePermissionRequest,
  locationServices,
  lowAccuracyTransform = (coords) => coords,
  normalizeCoordinates = ({
    latitude = 0,
    longitude = 0,
    accuracy = 10,
    altitude = null,
    altitudeAccuracy = null,
    heading = null,
    speed = null,
  }) =>
    createCoordinates({
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed,
    }),
  permissionStore,
}: {
  handlePermissionRequest?: HandlePermissionRequest;
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
    ...createPermissionsUser({ permissionStore, handlePermissionRequest }),

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
