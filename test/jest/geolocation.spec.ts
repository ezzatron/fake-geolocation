import { jest } from "@jest/globals";
import { Geolocation } from "../../src/index.js";

const position: GeolocationPosition = {
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

describe("Geolocation", () => {
  let geolocation: Geolocation;

  beforeEach(() => {
    geolocation = new Geolocation();
  });

  describe("when reading the current position", () => {
    let successFn: jest.Mock;

    beforeEach(async () => {
      successFn = jest.fn();

      await getCurrentPosition(geolocation, successFn);
    });

    it("should call the success callback", () => {
      expect(successFn).toHaveBeenCalledWith(position);
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
