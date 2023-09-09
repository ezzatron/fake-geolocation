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
import { StdGeolocation, StdGeolocationCoordinates } from "./types/std.js";
import { User, createUser } from "./user.js";

export function createStandardAPIs({
  handlePermissionRequest,
  lowAccuracyTransform = (coords) => coords,
}: {
  handlePermissionRequest?: HandlePermissionRequest;
  lowAccuracyTransform?: (
    coords: StdGeolocationCoordinates,
  ) => StdGeolocationCoordinates;
} = {}): {
  geolocation: StdGeolocation;
  locationServices: MutableLocationServices;
  permissions: Permissions;
  permissionStore: PermissionStore;
  user: User;
} {
  const locationServices = createLocationServices();

  const permissionStore = createPermissionStore({
    initialStates: new Map([[{ name: "geolocation" }, "prompt"]]),
  });

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
