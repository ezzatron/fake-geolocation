import { jest } from "@jest/globals";
import {
  GeolocationPositionError,
  LocationServices,
  createGeolocation,
  createLocationServices,
  createPositionUnavailableError,
} from "../../src/index.js";
import {
  StdGeolocation,
  StdGeolocationPosition,
  StdGeolocationPositionError,
  StdPositionCallback,
  StdPositionErrorCallback,
  StdPositionOptions,
} from "../../src/types/std.js";

const positionA: StdGeolocationPosition = {
  coords: {
    latitude: 40.71703581534977,
    longitude: -74.03457283319447,
    accuracy: 25.019,
    altitude: 22.27227783203125,
    altitudeAccuracy: 9.838127136230469,
    heading: null,
    speed: null,
  },
  timestamp: 1687923355537,
};
const positionB: StdGeolocationPosition = {
  coords: {
    latitude: 12,
    longitude: 34,
    accuracy: 56,
    altitude: 78,
    altitudeAccuracy: 9,
    heading: null,
    speed: null,
  },
  timestamp: 1690606392152,
};

describe("Geolocation", () => {
  let locationServices: LocationServices;
  let geolocation: StdGeolocation;

  let successFn: jest.Mock;
  let errorFn: jest.Mock;

  beforeEach(() => {
    locationServices = createLocationServices();
    geolocation = createGeolocation({ locationServices });

    successFn = jest.fn();
    errorFn = jest.fn();
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  describe("when location services throws an error", () => {
    describe("when the error is a GeolocationPositionError", () => {
      let error: StdGeolocationPositionError;

      beforeEach(() => {
        error = createPositionUnavailableError("<message>");
        jest.spyOn(locationServices, "getPosition").mockRejectedValue(error);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successFn, errorFn);
        });

        it("calls the error callback with the same error", () => {
          expect(errorFn).toHaveBeenCalled();
          expect(errorFn.mock.calls[0][0]).toBe(error);
        });
      });
    });

    describe("when the error is not a GeolocationPositionError", () => {
      let error: Error;

      beforeEach(() => {
        error = new Error("<message>");
        jest.spyOn(locationServices, "getPosition").mockRejectedValue(error);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successFn, errorFn);
        });

        it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and includes the original message", () => {
          expect(errorFn).toHaveBeenCalled();
          expect(errorFn.mock.calls[0][0]).toBeDefined();

          const error = errorFn.mock.calls[0][0] as GeolocationPositionError;

          expect(error).toBeInstanceOf(GeolocationPositionError);
          expect(error.code).toBe(
            GeolocationPositionError.POSITION_UNAVAILABLE,
          );
          expect(error.message).toBe("Location services error: <message>");
        });
      });
    });
  });

  describe("when there is no position", () => {
    beforeEach(() => {
      locationServices.setPosition(undefined);
    });

    describe("when reading the position with an error callback", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successFn, errorFn);
      });

      it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", () => {
        expect(errorFn).toHaveBeenCalled();
        expect(errorFn.mock.calls[0][0]).toBeDefined();

        const error = errorFn.mock.calls[0][0] as GeolocationPositionError;

        expect(error).toBeInstanceOf(GeolocationPositionError);
        expect(error.code).toBe(GeolocationPositionError.POSITION_UNAVAILABLE);
        expect(error.message).toBe("");
      });

      it("does not call the success callback", () => {
        expect(successFn).not.toHaveBeenCalled();
      });
    });

    describe("when reading the position without an error callback", () => {
      beforeEach(async () => {
        await getCurrentPosition(
          geolocation,
          successFn,
          undefined,
          undefined,
          AbortSignal.timeout(10),
        );
      });

      it("does not call the success callback", () => {
        expect(successFn).not.toHaveBeenCalled();
      });
    });
  });

  describe("when there is a position", () => {
    beforeEach(() => {
      locationServices.setPosition(positionA);
    });

    it("cannot be read synchronously", () => {
      let position: StdGeolocationPosition | undefined;
      geolocation.getCurrentPosition((nextPosition) => {
        position = nextPosition;
      });

      expect(position).toBeUndefined();
    });

    describe("when reading the position", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successFn, errorFn);
      });

      it("calls the success callback with the position", () => {
        expect(successFn).toHaveBeenCalledWith(positionA);
      });

      it("does not call the error callback", () => {
        expect(errorFn).not.toHaveBeenCalled();
      });
    });

    describe("when the position changes", () => {
      beforeEach(() => {
        locationServices.setPosition(positionB);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successFn, errorFn);
        });

        it("calls the success callback with the new position", () => {
          expect(successFn).toHaveBeenCalledWith(positionB);
        });

        it("does not call the error callback", () => {
          expect(errorFn).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe("when reading the position with a timeout", () => {
    describe("when the timeout is not exceeded", () => {
      describe("when there is a position", () => {
        beforeEach(async () => {
          locationServices.setPosition(positionA);

          await getCurrentPosition(geolocation, successFn, errorFn, {
            timeout: 1000,
          });
        });

        it("calls the success callback with the position", () => {
          expect(successFn).toHaveBeenCalledWith(positionA);
        });
      });

      describe("when there is no position", () => {
        beforeEach(async () => {
          locationServices.setPosition(undefined);

          await getCurrentPosition(geolocation, successFn, errorFn, {
            timeout: 1000,
          });
        });

        it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
          expect(errorFn).toHaveBeenCalled();
          expect(errorFn.mock.calls[0][0]).toBeDefined();

          const error = errorFn.mock.calls[0][0] as GeolocationPositionError;

          expect(error).toBeInstanceOf(GeolocationPositionError);
          expect(error.code).toBe(
            GeolocationPositionError.POSITION_UNAVAILABLE,
          );
          expect(error.message).toBe("");
        });
      });
    });

    describe("when the timeout is exceeded", () => {
      beforeEach(async () => {
        locationServices.setPosition(positionA);

        await getCurrentPosition(geolocation, successFn, errorFn, {
          timeout: 0,
        });
      });

      it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
        expect(errorFn).toHaveBeenCalled();
        expect(errorFn.mock.calls[0][0]).toBeDefined();

        const error = errorFn.mock.calls[0][0] as GeolocationPositionError;

        expect(error).toBeInstanceOf(GeolocationPositionError);
        expect(error.code).toBe(GeolocationPositionError.TIMEOUT);
        expect(error.message).toBe("");
      });
    });

    describe("when the timeout is negative", () => {
      beforeEach(async () => {
        locationServices.setPosition(positionA);

        await getCurrentPosition(geolocation, successFn, errorFn, {
          timeout: -1,
        });
      });

      it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
        expect(errorFn).toHaveBeenCalled();
        expect(errorFn.mock.calls[0][0]).toBeDefined();

        const error = errorFn.mock.calls[0][0] as GeolocationPositionError;

        expect(error).toBeInstanceOf(GeolocationPositionError);
        expect(error.code).toBe(GeolocationPositionError.TIMEOUT);
        expect(error.message).toBe("");
      });
    });
  });
});

async function getCurrentPosition(
  geolocation: StdGeolocation,
  successFn: StdPositionCallback,
  errorFn?: StdPositionErrorCallback,
  options?: StdPositionOptions,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal) {
      if (signal.aborted) {
        resolve();
        return;
      }

      signal.addEventListener(
        "abort",
        () => {
          resolve();
        },
        { once: true },
      );
    }

    geolocation.getCurrentPosition(
      (position) => {
        successFn(position);
        resolve();
      },
      errorFn &&
        ((error) => {
          errorFn(error);
          resolve();
        }),
      options,
    );
  });
}
