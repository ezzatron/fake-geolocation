import {
  PermissionStore,
  createDelegatedPermissions,
  type HandleAccessRequest,
} from "fake-permissions";
import { createAPIs } from "./create-apis.js";
import { createDelegatedGeolocation } from "./delegated-geolocation.js";
import { MutableLocationServices } from "./location-services.js";
import { User } from "./user.js";

export function createWrappedAPIs({
  geolocation: suppliedGeolocation,
  handleAccessRequest,
  lowAccuracyTransform,
  permissions: suppliedPermissions,
  permissionStore: suppliedPermissionStore,
}: {
  geolocation: Geolocation;
  handleAccessRequest?: HandleAccessRequest;
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;
  permissions: Permissions;
  permissionStore?: PermissionStore;
}): {
  geolocation: Geolocation;
  isUsingSuppliedAPIs: () => boolean;
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
  } = createAPIs({
    handleAccessRequest,
    lowAccuracyTransform,
    permissionStore: suppliedPermissionStore,
  });

  const {
    geolocation,
    selectDelegate: selectGeolocationDelegate,
    isDelegateSelected: isGeolocationDelegateSelected,
  } = createDelegatedGeolocation({
    delegates: [fakeGeolocation, suppliedGeolocation],
    permissionsDelegates: new Map([
      [fakeGeolocation, fakePermissions],
      [suppliedGeolocation, suppliedPermissions],
    ]),
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

    isUsingSuppliedAPIs() {
      return isGeolocationDelegateSelected(suppliedGeolocation);
    },
  };
}
