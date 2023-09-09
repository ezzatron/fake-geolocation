import {
  HandlePermissionRequest,
  PermissionStore,
  createPermissions,
  createStandardPermissionStore,
} from "fake-permissions";
import { createGeolocation } from "./geolocation.js";
import {
  MutableLocationServices,
  createLocationServices,
} from "./location-services.js";
import { StdGeolocation, StdGeolocationCoordinates } from "./types/std.js";
import { User, createUser } from "./user.js";

export function createStandardAPIs({
  handlePermissionRequest,
  lowAccuracyTransform = (coords) => coords,
  permissionStore = createStandardPermissionStore(),
}: {
  handlePermissionRequest?: HandlePermissionRequest;
  lowAccuracyTransform?: (
    coords: StdGeolocationCoordinates,
  ) => StdGeolocationCoordinates;
  permissionStore?: PermissionStore;
} = {}): {
  geolocation: StdGeolocation;
  locationServices: MutableLocationServices;
  permissions: Permissions;
  permissionStore: PermissionStore;
  user: User;
} {
  const locationServices = createLocationServices();

  const permissions = createPermissions({
    permissionStore,
  });

  const user = createUser({
    handlePermissionRequest,
    locationServices,
    lowAccuracyTransform,
    permissionStore,
  });

  const geolocation = createGeolocation({
    locationServices,
    permissions,

    async requestPermission(descriptor) {
      return user.requestPermission(descriptor);
    },
  });

  return {
    geolocation,
    locationServices,
    permissions,
    permissionStore,
    user,
  };
}
