import {
  HandlePermissionRequest,
  PermissionStore,
  User as PermissionsUser,
  createUser as createPermissionsUser,
} from "fake-permissions";
import { MutableLocationServices } from "./location-services.js";
import { StdGeolocationCoordinates } from "./types/std.js";

export interface User<PermissionNames extends string>
  extends PermissionsUser<PermissionNames> {
  enableLocationServices(): void;
  disableLocationServices(): void;
  jumpToCoordinates(coords: StdGeolocationCoordinates): void;
}

export function createUser<PermissionNames extends string>({
  handlePermissionRequest,
  locationServices,
  lowAccuracyTransform = (coords) => coords,
  permissionStore,
}: {
  handlePermissionRequest?: HandlePermissionRequest<PermissionNames>;
  locationServices: MutableLocationServices;
  lowAccuracyTransform?: (
    coords: StdGeolocationCoordinates,
  ) => StdGeolocationCoordinates;
  permissionStore: PermissionStore<PermissionNames>;
}): User<PermissionNames> {
  return {
    ...createPermissionsUser({ permissionStore, handlePermissionRequest }),

    enableLocationServices() {
      locationServices.enable();
    },

    disableLocationServices() {
      locationServices.disable();
    },

    jumpToCoordinates(coords: StdGeolocationCoordinates) {
      locationServices.setHighAccuracyCoordinates(coords);
      locationServices.setLowAccuracyCoordinates(lowAccuracyTransform(coords));
    },
  };
}
