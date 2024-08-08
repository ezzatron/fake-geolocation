import {
  createPermissionObserver,
  type PermissionObserver,
} from "fake-permissions";
import { type GeolocationPositionErrorCode } from "./geolocation-position-error.js";

export type GeolocationObserver = {
  waitForCoordinates(
    matcherOrMatchers?:
      | Partial<GeolocationCoordinates>
      | Partial<GeolocationCoordinates>[],
    task?: () => Promise<void>,
    positionOptions?: PositionOptions,
  ): Promise<void>;
  waitForPositionError(
    codeOrCodes?: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
    task?: () => Promise<void>,
    positionOptions?: PositionOptions,
  ): Promise<void>;
  waitForPermissionState: PermissionObserver["waitForState"];
};

export function createGeolocationObserver(
  geolocation: Geolocation,
  permissions: Permissions,
): GeolocationObserver {
  const permissionObserver = createPermissionObserver(permissions, {
    name: "geolocation",
  });

  return {
    async waitForCoordinates(matcherOrMatchers = [], task, positionOptions) {
      const matchers = normalizeMatchers(matcherOrMatchers);

      await Promise.all([
        new Promise<void>((resolve) => {
          const stop = watchPositionRetry(
            ({ coords }) => {
              if (!isMatchingCoords(matchers, coords)) return;
              stop();
              resolve();
            },
            undefined,
            positionOptions,
          );
        }),
        Promise.resolve(task?.()),
      ]);
    },

    async waitForPositionError(codeOrCodes = [], task, positionOptions) {
      const codes = normalizeCodes(codeOrCodes);

      await Promise.all([
        new Promise<void>((resolve) => {
          const stop = watchPositionRetry(
            undefined,
            (error) => {
              if (!isMatchingError(codes, error)) return;
              stop();
              resolve();
            },
            positionOptions,
          );
        }),
        Promise.resolve(task?.()),
      ]);
    },

    waitForPermissionState: permissionObserver.waitForState,
  };

  function isMatchingCoords(
    matchers: Partial<GeolocationCoordinates>[],
    coords: GeolocationCoordinates,
  ): boolean {
    if (matchers.length < 1) return true;

    nextMatcher: for (const matcher of matchers) {
      for (const property in matcher) {
        const a = matcher[property as keyof typeof matcher];
        const b = coords[property as keyof typeof coords];

        if (
          a !== b &&
          /* v8 ignore start: can't test without another execution context */
          !(typeof a === "undefined" && typeof b === "undefined") &&
          /* v8 ignore stop */
          !(Number.isNaN(a) && Number.isNaN(b))
        ) {
          continue nextMatcher;
        }
      }

      return true;
    }

    return false;
  }

  function isMatchingError(
    codes: GeolocationPositionErrorCode[],
    error: GeolocationPositionError,
  ): boolean {
    if (codes.length < 1) return true;

    return codes.includes(error.code as GeolocationPositionErrorCode);
  }

  function watchPositionRetry(
    successCallback?: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options: PositionOptions = {},
  ): () => void {
    let isStopped = false;
    let watchId: number = 0;

    startWatch();

    function startWatch() {
      if (isStopped) return;

      watchId = geolocation.watchPosition(
        (p) => {
          /* v8 ignore start: race condition failsafe */
          if (isStopped) return;
          /* v8 ignore stop */

          successCallback?.(p);
        },
        (e) => {
          /* v8 ignore start: race condition failsafe */
          if (isStopped) return;
          /* v8 ignore stop */

          geolocation.clearWatch(watchId);
          setTimeout(startWatch, 20);
          errorCallback?.(e);
        },
        options,
      );
    }

    return () => {
      isStopped = true;
      geolocation.clearWatch(watchId);
    };
  }
}

function normalizeMatchers(
  matchers: Partial<GeolocationCoordinates> | Partial<GeolocationCoordinates>[],
): Partial<GeolocationCoordinates>[] {
  return Array.isArray(matchers) ? matchers : [matchers];
}

function normalizeCodes(
  codes: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
): GeolocationPositionErrorCode[] {
  return Array.isArray(codes) ? codes : [codes];
}
