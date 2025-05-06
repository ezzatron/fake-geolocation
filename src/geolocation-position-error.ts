/**
 * The acquisition of the geolocation information failed because the page didn't
 * have the permission to do it.
 *
 * @see {@link globalThis.GeolocationPositionError.code | GeolocationPositionError.code}
 * @see {@link GeolocationPositionErrorCode} for the related union type.
 */
export const PERMISSION_DENIED: globalThis.GeolocationPositionError["PERMISSION_DENIED"] = 1;

/**
 * The acquisition of the geolocation failed because one or several internal
 * sources of position returned an internal error.
 *
 * @see {@link globalThis.GeolocationPositionError.code | GeolocationPositionError.code}
 * @see {@link GeolocationPositionErrorCode} for the related union type.
 */
export const POSITION_UNAVAILABLE: globalThis.GeolocationPositionError["POSITION_UNAVAILABLE"] = 2;

/**
 * Geolocation information was not obtained in the allowed time.
 *
 * @see {@link globalThis.GeolocationPositionError.code | GeolocationPositionError.code}
 * @see {@link GeolocationPositionErrorCode} for the related union type.
 */
export const TIMEOUT: globalThis.GeolocationPositionError["TIMEOUT"] = 3;

/**
 * One of the well-known values of
 * {@link globalThis.GeolocationPositionError.code | GeolocationPositionError.code}.
 */
export type GeolocationPositionErrorCode =
  | typeof PERMISSION_DENIED
  | typeof POSITION_UNAVAILABLE
  | typeof TIMEOUT;

let canConstruct = false;

/**
 * Create a fake W3C
 * {@link globalThis.GeolocationPositionError | GeolocationPositionError} with a
 * {@link globalThis.GeolocationPositionError.code | code} of `1` (permission
 * denied).
 *
 * @param message - The error message.
 *
 * @returns The fake W3C permission denied error.
 */
export function createPermissionDeniedError(
  message: string,
): globalThis.GeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(PERMISSION_DENIED, message);
}

/**
 * Create a fake W3C
 * {@link globalThis.GeolocationPositionError | GeolocationPositionError} with a
 * {@link globalThis.GeolocationPositionError.code | code} of `2` (position
 * unavailable).
 *
 * @param message - The error message.
 *
 * @returns The fake W3C position unavailable error.
 */
export function createPositionUnavailableError(
  message: string,
): globalThis.GeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(POSITION_UNAVAILABLE, message);
}

/**
 * Create a fake W3C
 * {@link globalThis.GeolocationPositionError | GeolocationPositionError} with a
 * {@link globalThis.GeolocationPositionError.code | code} of `3` (timeout).
 *
 * @param message - The error message.
 *
 * @returns The fake W3C timeout error.
 */
export function createTimeoutError(
  message: string,
): globalThis.GeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(TIMEOUT, message);
}

export class GeolocationPositionError {
  public static readonly PERMISSION_DENIED = PERMISSION_DENIED;
  public static readonly POSITION_UNAVAILABLE = POSITION_UNAVAILABLE;
  public static readonly TIMEOUT = TIMEOUT;
  public readonly PERMISSION_DENIED = PERMISSION_DENIED;
  public readonly POSITION_UNAVAILABLE = POSITION_UNAVAILABLE;
  public readonly TIMEOUT = TIMEOUT;

  readonly code: number;
  readonly message: string;

  constructor(code: number, message: string) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.code = code;
    this.message = message;
  }

  readonly [Symbol.toStringTag] = "GeolocationPositionError";
}
