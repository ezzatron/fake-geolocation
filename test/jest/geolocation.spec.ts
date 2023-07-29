import { jest } from "@jest/globals";
import {
  Geolocation,
  GeolocationPositionError,
  GeolocationStore,
  createGeolocationStore,
} from "../../src/index.js";

const positionA: GeolocationPosition = {
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
const positionB: GeolocationPosition = {
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
  let geolocationStore: GeolocationStore;
  let geolocation: Geolocation;

  let successFn: jest.Mock;
  let errorFn: jest.Mock;

  beforeEach(() => {
    geolocationStore = createGeolocationStore();
    geolocation = new Geolocation({ geolocationStore });

    successFn = jest.fn();
    errorFn = jest.fn();
  });

  describe("when there is no position", () => {
    beforeEach(() => {
      geolocationStore.set(undefined);
    });

    describe("when reading the position", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successFn, errorFn);
      });

      it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE", () => {
        expect(errorFn).toHaveBeenCalled();
        expect(errorFn.mock.calls[0][0]).toBeDefined();

        const error = errorFn.mock.calls[0][0] as GeolocationPositionError;

        expect(error).toBeInstanceOf(GeolocationPositionError);
        expect(error.code).toBe(GeolocationPositionError.POSITION_UNAVAILABLE);
        expect(error.message).toBe("Unable to retrieve location");
      });

      it("does not call the success callback", () => {
        expect(successFn).not.toHaveBeenCalled();
      });
    });
  });

  describe("when there is a position", () => {
    beforeEach(() => {
      geolocationStore.set(positionA);
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
        geolocationStore.set(positionB);
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
});

async function getCurrentPosition(
  geolocation: Geolocation,
  successFn: PositionCallback,
  errorFn?: PositionErrorCallback | null,
): Promise<void> {
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        successFn(position);
        resolve();
      },
      (error) => {
        errorFn?.(error);
        resolve();
      },
    );
  });
}
