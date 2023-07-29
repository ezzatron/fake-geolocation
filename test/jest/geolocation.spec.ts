import { jest } from "@jest/globals";
import {
  Geolocation,
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

  beforeEach(() => {
    geolocationStore = createGeolocationStore();
    geolocation = new Geolocation({ geolocationStore });
  });

  describe("when there is a position", () => {
    beforeEach(() => {
      geolocationStore.set(positionA);
    });

    describe("when reading the position", () => {
      let successFn: jest.Mock;

      beforeEach(async () => {
        successFn = jest.fn();

        await getCurrentPosition(geolocation, successFn);
      });

      it("should call the success callback with the position", () => {
        expect(successFn).toHaveBeenCalledWith(positionA);
      });
    });

    describe("when the position changes", () => {
      beforeEach(() => {
        geolocationStore.set(positionB);
      });

      describe("when reading the position", () => {
        let successFn: jest.Mock;

        beforeEach(async () => {
          successFn = jest.fn();

          await getCurrentPosition(geolocation, successFn);
        });

        it("should call the success callback with the new position", () => {
          expect(successFn).toHaveBeenCalledWith(positionB);
        });
      });
    });
  });
});

async function getCurrentPosition(
  geolocation: Geolocation,
  successFn: PositionCallback,
): Promise<void> {
  return new Promise((resolve) => {
    geolocation.getCurrentPosition((position) => {
      successFn(position);
      resolve();
    });
  });
}
