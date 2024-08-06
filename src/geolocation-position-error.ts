export const PERMISSION_DENIED: globalThis.GeolocationPositionError["PERMISSION_DENIED"] = 1;
export const POSITION_UNAVAILABLE: globalThis.GeolocationPositionError["POSITION_UNAVAILABLE"] = 2;
export const TIMEOUT: globalThis.GeolocationPositionError["TIMEOUT"] = 3;

export type GeolocationPositionErrorCode =
  | typeof PERMISSION_DENIED
  | typeof POSITION_UNAVAILABLE
  | typeof TIMEOUT;

let canConstruct = false;

export function createPermissionDeniedError(
  message: string,
): globalThis.GeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(PERMISSION_DENIED, message);
}

export function createPositionUnavailableError(
  message: string,
): globalThis.GeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(POSITION_UNAVAILABLE, message);
}

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
