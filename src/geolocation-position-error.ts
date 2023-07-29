import { StdGeolocationPositionError } from "./types/std.js";

const PERMISSION_DENIED: StdGeolocationPositionError["PERMISSION_DENIED"] = 1;
const POSITION_UNAVAILABLE: StdGeolocationPositionError["POSITION_UNAVAILABLE"] = 2;
const TIMEOUT: StdGeolocationPositionError["TIMEOUT"] = 3;

export function createPositionUnavailableError(): StdGeolocationPositionError {
  return new GeolocationPositionError(
    POSITION_UNAVAILABLE,
    "Unable to retrieve location",
  );
}

export class GeolocationPositionError extends Error {
  public static readonly PERMISSION_DENIED = PERMISSION_DENIED;
  public static readonly POSITION_UNAVAILABLE = POSITION_UNAVAILABLE;
  public static readonly TIMEOUT = TIMEOUT;
  public readonly PERMISSION_DENIED = PERMISSION_DENIED;
  public readonly POSITION_UNAVAILABLE = POSITION_UNAVAILABLE;
  public readonly TIMEOUT = TIMEOUT;

  readonly code: number;

  constructor(code: number, message: string) {
    super(message);

    this.code = code;
  }
}

GeolocationPositionError satisfies new (
  ...args: never[]
) => StdGeolocationPositionError;
