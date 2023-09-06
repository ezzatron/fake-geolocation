import {
  HandlePermissionRequest,
  PermissionStore,
  createDelegatedPermissions,
} from "fake-permissions";
import { createStandardAPIs } from "./create-standard-apis.js";
import { createDelegatedGeolocation } from "./delegated-geolocation.js";
import { MutableLocationServices } from "./location-services.js";
import { StdGeolocation, StdGeolocationCoordinates } from "./types/std.js";
import { User } from "./user.js";

export function createWrappedAPIs({
  geolocation: suppliedGeolocation,
  handlePermissionRequest,
  lowAccuracyTransform,
  permissions: suppliedPermissions,
}: {
  geolocation: StdGeolocation;
  handlePermissionRequest?: HandlePermissionRequest;
  lowAccuracyTransform?: (
    coords: StdGeolocationCoordinates,
  ) => StdGeolocationCoordinates;
  permissions: Permissions;
}): {
  geolocation: StdGeolocation;
  locationServices: MutableLocationServices;
  permissions: Permissions;
  permissionStore: PermissionStore;
  selectAPIs: (useSuppliedAPIs: boolean) => void;
  user: User;
} {
  const {
    geolocation: fakeGeolocation,
    locationServices,
    permissions: fakePermissions,
    permissionStore,
    user,
  } = createStandardAPIs({
    handlePermissionRequest,
    lowAccuracyTransform,
  });

  const { geolocation, selectDelegate: selectGeolocationDelegate } =
    createDelegatedGeolocation({
      delegates: [fakeGeolocation, suppliedGeolocation],
    });

  const { permissions, selectDelegate: selectPermissionsDelegate } =
    createDelegatedPermissions({
      delegates: [fakePermissions, suppliedPermissions],
    });

  return {
    geolocation,
    locationServices,
    permissions,
    permissionStore,
    user,

    selectAPIs(useSuppliedAPIs) {
      selectGeolocationDelegate(
        useSuppliedAPIs ? suppliedGeolocation : fakeGeolocation,
      );
      selectPermissionsDelegate(
        useSuppliedAPIs ? suppliedPermissions : fakePermissions,
      );
    },
  };
}
