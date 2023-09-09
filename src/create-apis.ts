import {
  HandlePermissionRequest,
  PermissionStore,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { createGeolocation } from "./geolocation.js";
import {
  MutableLocationServices,
  createLocationServices,
} from "./location-services.js";
import { User, createUser } from "./user.js";

export function createAPIs({
  handlePermissionRequest,
  lowAccuracyTransform = (coords) => coords,
  permissionStore = createPermissionStore(),
}: {
  handlePermissionRequest?: HandlePermissionRequest;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
  permissionStore?: PermissionStore;
} = {}): {
  geolocation: Geolocation;
  locationServices: MutableLocationServices;
  permissions: Permissions;
  permissionStore: PermissionStore;
  user: User;
} {
  const locationServices = createLocationServices();
  const permissions = createPermissions({ permissionStore });

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
