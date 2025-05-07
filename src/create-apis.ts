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
import type { LocationServicesParameters } from "./location-services.js";
import {
  MutableLocationServices,
  createLocationServices,
} from "./location-services.js";
import { User, createUser, type UserParameters } from "./user.js";

export type _DocsTypes = LocationServicesParameters | UserParameters;

/**
 * Parameters for creating paired fake W3C {@link Permissions} and
 * {@link Geolocation} APIs.
 *
 * @see {@link createAPIs} to create paired fake W3C {@link Permissions} and
 *   {@link Geolocation} APIs.
 */
export interface CreateAPIsParameters {
  /**
   * An optional delay in milliseconds to wait for all coordinates to be
   * acquired.
   *
   * @defaultValue `undefined`
   *
   * @see {@link LocationServicesParameters.acquireDelay}
   */
  acquireDelay?: number;

  /**
   * An optional handler to use for permission access requests.
   *
   * If omitted, permission access requests will be immediately dismissed.
   *
   * @defaultValue `async () => {}`
   *
   * @see {@link HandleAccessRequest}
   */
  handleAccessRequest?: HandleAccessRequest;

  /**
   * An optional function to transform high accuracy coordinates to low accuracy
   * coordinates.
   *
   * @param coords - The high accuracy coordinates.
   *
   * @returns The low accuracy coordinates.
   *
   * @defaultValue `(coords) => coords`
   *
   * @see {@link UserParameters.lowAccuracyTransform}
   */
  lowAccuracyTransform?: (
    coords: GeolocationCoordinates,
  ) => GeolocationCoordinates;

  /**
   * An optional permission store to use.
   *
   * @defaultValue The result of calling {@link createPermissionStore} with no
   *   arguments.
   */
  permissionStore?: PermissionStore;
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
  const {
    acquireDelay,
    handleAccessRequest,
    lowAccuracyTransform,
    permissionStore = createPermissionStore(),
  } = params;

  const locationServices = createLocationServices({ acquireDelay });
  const permissions = createPermissions({ permissionStore });
  const geolocation = createGeolocation({ locationServices, permissionStore });
  const observer = createGeolocationObserver(geolocation, permissions);

  const user = createUser({
    handleAccessRequest,
    locationServices,
    lowAccuracyTransform,
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
