import { createPermissionObserver } from "fake-permissions";
import type { GeolocationCoordinatesParameters } from "./geolocation-coordinates.js";
import { type GeolocationPositionErrorCode } from "./geolocation-position-error.js";

/**
 * An observer for geolocation changes.
 */
export interface GeolocationObserver {
  /**
   * Wait for the geolocation coordinates to match one of the supplied matchers.
   *
   * Watches the geolocation position with the {@link Geolocation} API supplied
   * to {@link createGeolocationObserver} and resolves when coordinates are
   * acquired that match one of the supplied matchers.
   *
   * The acquired coordinates must match all properties of at least one supplied
   * matcher in order to be considered a match. If no matchers are supplied,
   * then _any_ acquired coordinates will be considered a match.
   *
   * @param matcherOrMatchers - The matcher(s) to match against.
   * @param task - An optional task to execute while waiting for the acquired
   *   coordinates to match. You can use this to guarantee that certain actions
   *   are performed after observation has started.
   * @param positionOptions - The options to pass to
   *   {@link Geolocation.watchPosition}.
   *
   * @returns A promise that resolves when coordinates are acquired that match
   *   one of the matchers.
   */
  waitForCoordinates: (
    matcherOrMatchers?:
      | Partial<GeolocationCoordinatesParameters>
      | Partial<GeolocationCoordinatesParameters>[],
    task?: () => Promise<void>,
    positionOptions?: PositionOptions,
  ) => Promise<void>;

  /**
   * Wait for the geolocation position error to match one of the supplied
   * {@link GeolocationPositionError.code} codes.
   *
   * Watches the geolocation position with the {@link Geolocation} API supplied
   * to {@link createGeolocationObserver} and resolves when a position error is
   * received that has a {@link GeolocationPositionError.code | code} that is
   * one of the supplied codes.
   *
   * If no codes are supplied, then _any_ received position error will be
   * considered a match.
   *
   * @param codeOrCodes - The {@link GeolocationPositionError.code} code(s) to
   *   match against.
   * @param task - An optional task to execute while waiting for the received
   *   position error to match. You can use this to guarantee that certain
   *   actions are performed after observation has started.
   * @param positionOptions - The options to pass to
   *   {@link Geolocation.watchPosition}.
   *
   * @returns A promise that resolves when a position error is received that has
   *   a {@link GeolocationPositionError.code | code} that is one of the
   *   supplied codes.
   */
  waitForPositionError: (
    codeOrCodes?: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
    task?: () => Promise<void>,
    positionOptions?: PositionOptions,
  ) => Promise<void>;

  /**
   * Wait for the geolocation permission state to change to one of the specified
   * states.
   *
   * @param stateOrStates - The desired permission state(s).
   * @param task - An optional task to execute while waiting for the state
   *   change. You can use this to guarantee that certain actions are performed
   *   after observation has started.
   *
   * @returns A promise that resolves when the geolocation permission state
   *   matches one of the desired states. If the state is already one of the
   *   desired states, the promise resolves immediately.
   * @throws A {@link TypeError} if no states are provided.
   */
  waitForPermissionState: (
    stateOrStates: PermissionState | PermissionState[],
    task?: () => Promise<void>,
  ) => Promise<void>;
}

/**
 * Create a geolocation observer.
 *
 * @param geolocation - The Geolocation API to use.
 * @param permissions - The Permissions API to use.
 *
 * @returns A geolocation observer.
 */
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
    matchers: Partial<GeolocationCoordinatesParameters>[],
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
  matchers:
    | Partial<GeolocationCoordinatesParameters>
    | Partial<GeolocationCoordinatesParameters>[],
): Partial<GeolocationCoordinatesParameters>[] {
  return Array.isArray(matchers) ? matchers : [matchers];
}

function normalizeCodes(
  codes: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
): GeolocationPositionErrorCode[] {
  return Array.isArray(codes) ? codes : [codes];
}
