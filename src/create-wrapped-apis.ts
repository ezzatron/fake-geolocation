import { PermissionStore, createDelegatedPermissions } from "fake-permissions";
import { createAPIs, type CreateAPIsParameters } from "./create-apis.js";
import { createDelegatedGeolocation } from "./delegated-geolocation.js";
import {
  createGeolocationObserver,
  type GeolocationObserver,
} from "./geolocation-observer.js";
import { MutableLocationServices } from "./location-services.js";
import { User } from "./user.js";

export type _DocsTypes = typeof createAPIs;

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
 * The result of calling {@link createWrappedAPIs}.
 */
export interface CreateWrappedAPIsResult {
  /**
   * The wrapped W3C {@link Geolocation} API.
   */
  readonly geolocation: Geolocation;

  /**
   * A handle for controlling the wrapped APIs.
   */
  readonly handle: WrappedAPIsHandle;

  /**
   * The virtual location services.
   */
  readonly locationServices: MutableLocationServices;

  /**
   * An observer for geolocation changes.
   */
  readonly observer: GeolocationObserver;

  /**
   * The wrapped W3C {@link Permissions} API.
   */
  readonly permissions: Permissions;

  /**
   * A store for managing permission access.
   */
  readonly permissionStore: PermissionStore;

  /**
   * a virtual user that can affect geolocation and permissions.
   */
  readonly user: User;
}

/**
 * A handle for controlling wrapped {@link Permissions} and {@link Geolocation}
 * APIs.
 */
export interface WrappedAPIsHandle {
  /**
   * Check if the wrapped APIs are using the originally supplied APIs, or the
   * fake APIs.
   *
   * @returns `true` if the wrapped APIs are using the originally supplied
   *   APIs, or `false` if they are using the fake APIs.
   */
  isUsingSuppliedAPIs: () => boolean;

  /**
   * Select the APIs to use.
   *
   * @param useSuppliedAPIs - If `true`, the originally supplied APIs are used.
   *   If `false`, the fake APIs are used.
   */
  selectAPIs: (useSuppliedAPIs: boolean) => void;
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
 * @returns The wrapped APIs, and a handle for controlling them, along with
 *   other useful services.
 *
 * @see {@link createAPIs} to create paired fake APIs without wrapping existing
 *   APIs.
 *
 * @inlineType CreateWrappedAPIsParameters
 * @inlineType CreateWrappedAPIsResult
 */
export function createWrappedAPIs(
  params: CreateWrappedAPIsParameters,
): CreateWrappedAPIsResult {
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

  const { geolocation, handle: geolocationHandle } = createDelegatedGeolocation(
    {
      delegates: [fakeGeolocation, suppliedGeolocation],
      permissionsDelegates: new Map([
        [fakeGeolocation, fakePermissions],
        [suppliedGeolocation, suppliedPermissions],
      ]),
    },
  );

  const { permissions, handle: permissionsHandle } = createDelegatedPermissions(
    {
      delegates: [fakePermissions, suppliedPermissions],
    },
  );

  const observer = createGeolocationObserver(geolocation, permissions);

  const handle: WrappedAPIsHandle = {
    selectAPIs(useSuppliedAPIs) {
      geolocationHandle.selectDelegate(
        useSuppliedAPIs ? suppliedGeolocation : fakeGeolocation,
      );
      permissionsHandle.selectDelegate(
        useSuppliedAPIs ? suppliedPermissions : fakePermissions,
      );
    },

    isUsingSuppliedAPIs() {
      return geolocationHandle.isSelectedDelegate(suppliedGeolocation);
    },
  };

  return {
    geolocation,
    handle,
    locationServices,
    observer,
    permissions,
    permissionStore,
    user,
  };
}
