import { PermissionStore, createDelegatedPermissions } from "fake-permissions";
import { createAPIs, type CreateAPIsParameters } from "./create-apis.js";
import { createDelegatedGeolocation } from "./delegated-geolocation.js";
import {
  createGeolocationObserver,
  type GeolocationObserver,
} from "./geolocation-observer.js";
import { MutableLocationServices } from "./location-services.js";
import { User } from "./user.js";

/**
 * Parameters for creating paired fake W3C {@link Permissions} and
 * {@link Geolocation} APIs that wrap the supplied APIs.
 *
 * @see {@link createWrappedAPIs} to create paired fake W3C {@link Permissions} and
 *   {@link Geolocation} APIs that wrap the supplied APIs.
 */
export interface CreateWrappedAPIsParameters extends CreateAPIsParameters {
  /**
   * The W3C {@link Geolocation} API to wrap.
   */
  geolocation: Geolocation;

  /**
   * The W3C {@link Permissions} API to wrap.
   */
  permissions: Permissions;
}

/**
 * Create paired fake W3C {@link Permissions} and {@link Geolocation} APIs that
 * wrap the supplied APIs.
 *
 * Internally, this function creates paired fake APIs using {@link createAPIs}.
 * Then it wraps these APIs and the supplied APIs using
 * {@link createDelegatedPermissions} and {@link createDelegatedGeolocation} to
 * create delegated APIs that can switch between the fake and supplied APIs
 * dynamically.
 *
 * @param params - The parameters for creating paired fake W3C
 *   {@link Permissions} and {@link Geolocation} APIs that wrap the supplied
 *   APIs.
 *
 * @returns The wrapped APIs, along with other useful objects.
 *
 * @see {@link createAPIs} to create paired fake APIs without wrapping existing
 *   APIs.
 *
 * @inlineType CreateWrappedAPIsParameters
 */
export function createWrappedAPIs(params: CreateWrappedAPIsParameters): {
  /**
   * The wrapped W3C {@link Geolocation} API.
   */
  geolocation: Geolocation;

  /**
   * Check if the wrapped APIs are using the originally supplied APIs, or the
   * fake APIs.
   *
   * @returns `true` if the wrapped APIs are using the originally supplied
   *   APIs, or `false` if they are using the fake APIs.
   */
  isUsingSuppliedAPIs: () => boolean;

  /**
   * The virtual location services.
   */
  locationServices: MutableLocationServices;

  /**
   * An observer for geolocation changes.
   */
  observer: GeolocationObserver;

  /**
   * The wrapped W3C {@link Permissions} API.
   */
  permissions: Permissions;

  /**
   * A store for managing permission access.
   */
  permissionStore: PermissionStore;

  /**
   * Select the APIs to use.
   *
   * @param useSuppliedAPIs - If `true`, the originally supplied APIs are used.
   *   If `false`, the fake APIs are used.
   */
  selectAPIs: (useSuppliedAPIs: boolean) => void;

  /**
   * a virtual user that can affect geolocation and permissions.
   */
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
