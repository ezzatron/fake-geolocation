import type { PartialGeolocationCoordinates } from "./geolocation-coordinates.js";
import {
  PERMISSION_DENIED,
  type GeolocationPositionErrorCode,
} from "./geolocation-position-error.js";

export type GeolocationObserver = {
  waitForCoordinates(
    matcherOrMatchers?:
      | PartialGeolocationCoordinates
      | PartialGeolocationCoordinates[],
    task?: () => Promise<void>,
  ): Promise<void>;
  waitForCoordinatesChange(
    matcherOrMatchers?:
      | PartialGeolocationCoordinates
      | PartialGeolocationCoordinates[],
    task?: () => Promise<void>,
  ): Promise<void>;
  waitForPositionError(
    codeOrCodes?: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
    task?: () => Promise<void>,
  ): Promise<void>;
  waitForPositionErrorChange(
    codeOrCodes?: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
    task?: () => Promise<void>,
  ): Promise<void>;
};

export async function createGeolocationObserver(
  geolocation: Geolocation,
  options?: PositionOptions,
): Promise<GeolocationObserver> {
  let watchId: number;
  let p: GeolocationPosition | undefined;
  let e: globalThis.GeolocationPositionError | undefined;
  const positionCallbacks = new Set<() => void>();
  const errorCallbacks = new Set<() => void>();

  startWatch();

  return {
    async waitForCoordinates(matcherOrMatchers = [], task) {
      const matchers = normalizeMatchers(matcherOrMatchers);

      if (isMatchingCoords(matchers)) return;

      await waitForCoordinatesChange(matchers, task);
    },

    waitForCoordinatesChange,

    async waitForPositionError(codeOrCodes = [], task) {
      const codes = normalizeCodes(codeOrCodes);

      if (isMatchingError(codes)) return;

      await waitForPositionErrorChange(codes, task);
    },

    waitForPositionErrorChange,
  };

  async function waitForCoordinatesChange(
    matcherOrMatchers:
      | PartialGeolocationCoordinates
      | PartialGeolocationCoordinates[] = [],
    task?: () => Promise<void>,
  ) {
    const matchers = normalizeMatchers(matcherOrMatchers);

    await Promise.all([
      new Promise<void>((resolve) => {
        positionCallbacks.add(onChange);

        function onChange() {
          if (!isMatchingCoords(matchers)) return;

          positionCallbacks.delete(onChange);
          resolve();
        }
      }),
      Promise.resolve(task?.()),
    ]);
  }

  async function waitForPositionErrorChange(
    codeOrCodes:
      | GeolocationPositionErrorCode
      | GeolocationPositionErrorCode[] = [],
    task?: () => Promise<void>,
  ) {
    const codes = normalizeCodes(codeOrCodes);

    await Promise.all([
      new Promise<void>((resolve) => {
        errorCallbacks.add(onChange);

        function onChange() {
          if (!isMatchingError(codes)) return;

          errorCallbacks.delete(onChange);
          resolve();
        }
      }),
      Promise.resolve(task?.()),
    ]);
  }

  function isMatchingCoords(
    matchers: PartialGeolocationCoordinates[],
  ): boolean {
    if (!p) return false;
    if (matchers.length < 1) return true;

    const c = p.coords;

    nextMatcher: for (const m of matchers) {
      for (const property in m) {
        if (m[property as keyof typeof m] !== c[property as keyof typeof c]) {
          continue nextMatcher;
        }
      }

      return true;
    }

    return false;
  }

  function isMatchingError(codes: GeolocationPositionErrorCode[]): boolean {
    if (!e) return false;
    if (codes.length < 1) return true;

    return codes.includes(e.code as GeolocationPositionErrorCode);
  }

  function startWatch() {
    watchId = geolocation.watchPosition(
      (position) => {
        p = position;
        e = undefined;
        for (const cb of positionCallbacks) cb();
      },
      (error) => {
        e = error;
        p = undefined;
        for (const cb of errorCallbacks) cb();

        if (error.code !== PERMISSION_DENIED) return;

        // Permission denied errors encountered while establishing a watch
        // are not recoverable. We need to clear the watch and start a new one.
        geolocation.clearWatch(watchId);
        setTimeout(startWatch, 20);
      },
      options,
    );
  }
}

function normalizeMatchers(
  matchers: PartialGeolocationCoordinates | PartialGeolocationCoordinates[],
): PartialGeolocationCoordinates[] {
  return Array.isArray(matchers) ? matchers : [matchers];
}

function normalizeCodes(
  codes: GeolocationPositionErrorCode | GeolocationPositionErrorCode[],
): GeolocationPositionErrorCode[] {
  return Array.isArray(codes) ? codes : [codes];
}
