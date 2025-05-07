import {
  PermissionStore,
  createPermissionStore,
  createPermissions,
  type PermissionStoreParameters,
} from "fake-permissions";
import type { createWrappedAPIs } from "./create-wrapped-apis.js";
import {
  createGeolocationObserver,
  type GeolocationObserver,
} from "./geolocation-observer.js";
import { createGeolocation } from "./geolocation.js";
import type { LocationServicesParameters } from "./location-services.js";
import {
  MutableLocationServices,
  createLocationServices,
} from "./location-services.js";
import { User, createUser, type UserParameters } from "./user.js";

export type _DocsTypes =
  | LocationServicesParameters
  | UserParameters
  | typeof createWrappedAPIs;

/**
 * Parameters for creating paired fake W3C {@link Permissions} and
 * {@link Geolocation} APIs.
 *
 * @see {@link createAPIs} to create paired fake W3C {@link Permissions} and
 *   {@link Geolocation} APIs.
 */
export interface CreateAPIsParameters {
  /**
   * Optional parameters to use when creating the location services.
   *
   * @defaultValue `undefined`
   */
  locationServicesParams?: LocationServicesParameters;

  /**
   * Optional parameters to use when creating the permission store.
   *
   * @defaultValue `undefined`
   */
  permissionStoreParams?: PermissionStoreParameters;

  /**
   * Optional parameters to use when creating the user.
   *
   * @defaultValue `undefined`
   */
  userParams?: Omit<UserParameters, "locationServices" | "permissionStore">;
}

/**
 * Create paired fake W3C {@link Permissions} and {@link Geolocation} APIs.
 *
 * The permission access state of the geolocation permission in the permission
 * store is used by the fake {@link Geolocation} API. This allows you to
 * simulate how real browser permissions affect the behavior of the
 * {@link Geolocation} API.
 *
 * @param params - The parameters for creating paired fake W3C
 *   {@link Permissions} and {@link Geolocation} APIs.
 *
 * @returns The paired APIs, along with other useful objects.
 *
 * @see {@link createWrappedAPIs} to create paired fake APIs that wrap existing
 *    APIs.
 *
 * @inlineType CreateAPIsParameters
 */
export function createAPIs(params: CreateAPIsParameters = {}): {
  /**
   * The fake W3C {@link Geolocation} API.
   */
  geolocation: Geolocation;

  /**
   * The virtual location services.
   */
  locationServices: MutableLocationServices;

  /**
   * An observer for geolocation changes.
   */
  observer: GeolocationObserver;

  /**
   * The fake W3C {@link Permissions} API.
   */
  permissions: Permissions;

  /**
   * A store for managing permission access.
   */
  permissionStore: PermissionStore;

  /**
   * a virtual user that can affect geolocation and permissions.
   */
  user: User;
} {
  const locationServices = createLocationServices(
    params.locationServicesParams,
  );
  const permissionStore = createPermissionStore(params.permissionStoreParams);

  const geolocation = createGeolocation({ locationServices, permissionStore });
  const permissions = createPermissions({ permissionStore });

  const observer = createGeolocationObserver(geolocation, permissions);
  const user = createUser({
    ...params.userParams,
    locationServices,
    permissionStore,
  });

  return {
    geolocation,
    locationServices,
    observer,
    permissions,
    permissionStore,
    user,
  };
}
