import {
  HandlePermissionRequest,
  PermissionStore,
  Permissions,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import { PROMPT } from "fake-permissions/constants/permission-state";
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
  handlePermissionRequest?: HandlePermissionRequest<typeof GEOLOCATION>;
  lowAccuracyTransform?: (
    coords: StdGeolocationCoordinates,
  ) => StdGeolocationCoordinates;
} = {}): {
  geolocation: StdGeolocation;
  locationServices: MutableLocationServices;
  permissions: Permissions<typeof GEOLOCATION>;
  permissionStore: PermissionStore<typeof GEOLOCATION>;
  user: User<typeof GEOLOCATION>;
} {
  const locationServices = createLocationServices();

  const permissionStore = createPermissionStore({
    initialStates: new Map([[{ name: GEOLOCATION }, PROMPT]]),
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
