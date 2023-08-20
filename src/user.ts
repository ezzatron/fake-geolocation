import {
  HandlePermissionRequest,
  PermissionStore,
  User as PermissionsUser,
  createUser as createPermissionsUser,
} from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import { MutableLocationServices } from "./location-services.js";
import { StdGeolocationCoordinates } from "./types/std.js";

export interface User extends PermissionsUser<typeof GEOLOCATION> {
  jumpToCoordinates(coords: StdGeolocationCoordinates): void;
}

export function createUser({
  handlePermissionRequest,
  locationServices,
  permissionStore,
}: {
  handlePermissionRequest?: HandlePermissionRequest<typeof GEOLOCATION>;
  locationServices: MutableLocationServices;
  permissionStore: PermissionStore<typeof GEOLOCATION>;
}): User {
  return {
    ...createPermissionsUser({ permissionStore, handlePermissionRequest }),

    jumpToCoordinates(coords: StdGeolocationCoordinates) {
      locationServices.setCoordinates(coords);
    },
  };
}
