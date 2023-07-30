import { StdGeolocationPositionError } from "./types/std.js";

const PERMISSION_DENIED: StdGeolocationPositionError["PERMISSION_DENIED"] = 1;
const POSITION_UNAVAILABLE: StdGeolocationPositionError["POSITION_UNAVAILABLE"] = 2;
const TIMEOUT: StdGeolocationPositionError["TIMEOUT"] = 3;

let canConstruct = false;

export function createPositionUnavailableError(): StdGeolocationPositionError {
  canConstruct = true;

  return new GeolocationPositionError(
    POSITION_UNAVAILABLE,
    "Unable to retrieve location",
  );
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

GeolocationPositionError satisfies new (
  ...args: never[]
) => StdGeolocationPositionError;
