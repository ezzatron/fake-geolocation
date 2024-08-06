import {
  HandleAccessRequest,
  PermissionStore,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import {
  createGeolocationObserver,
  type GeolocationObserver,
} from "./geolocation-observer.js";
import { createGeolocation } from "./geolocation.js";
import {
  MutableLocationServices,
  createLocationServices,
} from "./location-services.js";
import { User, createUser } from "./user.js";

export function createAPIs({
  acquireDelay,
  handleAccessRequest,
  lowAccuracyTransform = (coords) => coords,
  permissionStore = createPermissionStore(),
}: {
  acquireDelay?: number;
  handleAccessRequest?: HandleAccessRequest;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
  permissionStore?: PermissionStore;
} = {}): {
  geolocation: Geolocation;
  locationServices: MutableLocationServices;
  observer: GeolocationObserver;
  permissions: Permissions;
  permissionStore: PermissionStore;
  user: User;
} {
  const locationServices = createLocationServices({ acquireDelay });
  const permissions = createPermissions({ permissionStore });

  const user = createUser({
    handleAccessRequest,
    locationServices,
    lowAccuracyTransform,
    permissionStore,
  });

  const geolocation = createGeolocation({
    locationServices,
    permissionStore,
    user,
  });

  const observer = createGeolocationObserver(geolocation, permissions);

  return {
    geolocation,
    locationServices,
    observer,
    permissions,
    permissionStore,
    user,
  };
}
