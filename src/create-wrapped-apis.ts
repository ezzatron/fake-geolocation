import { PermissionStore, createDelegatedPermissions } from "fake-permissions";
import { createAPIs, type CreateAPIsParameters } from "./create-apis.js";
import { createDelegatedGeolocation } from "./delegated-geolocation.js";
import {
  createGeolocationObserver,
  type GeolocationObserver,
} from "./geolocation-observer.js";
import { MutableLocationServices } from "./location-services.js";
import { User } from "./user.js";

export interface CreateWrappedAPIsParameters extends CreateAPIsParameters {
  geolocation: Geolocation;
  permissions: Permissions;
}

/**
 * @inlineType CreateWrappedAPIsParameters
 */
export function createWrappedAPIs(params: CreateWrappedAPIsParameters): {
  geolocation: Geolocation;
  isUsingSuppliedAPIs: () => boolean;
  locationServices: MutableLocationServices;
  observer: GeolocationObserver;
  permissions: Permissions;
  permissionStore: PermissionStore;
  selectAPIs: (useSuppliedAPIs: boolean) => void;
  user: User;
} {
  const {
    geolocation: suppliedGeolocation,
    permissions: suppliedPermissions,
    ...createAPIsParams
  } = params;

  const {
    geolocation: fakeGeolocation,
    locationServices,
    permissions: fakePermissions,
    permissionStore,
    user,
  } = createAPIs(createAPIsParams);

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

  const observer = createGeolocationObserver(geolocation, permissions);

  return {
    geolocation,
    locationServices,
    observer,
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
