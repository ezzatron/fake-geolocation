import { StdGeolocationPositionError } from "./types/std.js";

const PERMISSION_DENIED: StdGeolocationPositionError["PERMISSION_DENIED"] = 1;
const POSITION_UNAVAILABLE: StdGeolocationPositionError["POSITION_UNAVAILABLE"] = 2;
const TIMEOUT: StdGeolocationPositionError["TIMEOUT"] = 3;

let canConstruct = false;

export function createPositionUnavailableError(
  message: string,
): StdGeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(POSITION_UNAVAILABLE, message);
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
}

export function isGeolocationPositionError(
  error: unknown,
): error is StdGeolocationPositionError {
  return Boolean(
    error &&
      typeof error === "object" &&
      error.constructor?.name === "GeolocationPositionError" &&
      "PERMISSION_DENIED" in error &&
      typeof error.PERMISSION_DENIED === "number" &&
      "POSITION_UNAVAILABLE" in error &&
      typeof error.POSITION_UNAVAILABLE === "number" &&
      "TIMEOUT" in error &&
      typeof error.TIMEOUT === "number" &&
      "code" in error &&
      typeof error.code === "number" &&
      "message" in error &&
      typeof error.message === "string",
  );
}

GeolocationPositionError satisfies new (
  ...args: never[]
) => StdGeolocationPositionError;
