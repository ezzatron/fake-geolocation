import {
  HandlePermissionRequest,
  PermissionStore,
  User as PermissionsUser,
  createUser as createPermissionsUser,
} from "fake-permissions";
import { MutableLocationServices } from "./location-services.js";

export interface User extends PermissionsUser {
  enableLocationServices(): void;
  disableLocationServices(): void;
  jumpToCoordinates(coords: GeolocationCoordinates): void;
}

export function createUser({
  handlePermissionRequest,
  locationServices,
  lowAccuracyTransform = (coords) => coords,
  permissionStore,
}: {
  handlePermissionRequest?: HandlePermissionRequest;
  locationServices: MutableLocationServices;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
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

    jumpToCoordinates(coords: GeolocationCoordinates) {
      locationServices.setHighAccuracyCoordinates(coords);
      locationServices.setLowAccuracyCoordinates(lowAccuracyTransform(coords));
    },
  };
}
