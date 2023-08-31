import { createCoordinates, createPosition } from "../../src/index.js";
import {
  StdGeolocationCoordinates,
  StdGeolocationPosition,
} from "../../src/types/std.js";

describe("GeolocationPosition", () => {
  let coords: StdGeolocationCoordinates;
  let position: StdGeolocationPosition;

  beforeEach(() => {
    coords = createCoordinates({
      latitude: 40.71703581534977,
      longitude: -74.03457283319447,
      accuracy: 25.019,
      altitude: 22.27227783203125,
      altitudeAccuracy: 9.838127136230469,
      heading: 90,
      speed: 111,
    });

    position = createPosition(coords, 1687923355537, true);
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (position.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  it("copies the coords", () => {
    expect(position.coords).not.toBe(coords);
  });

  it("has a coords property", () => {
    expect(position.coords).toMatchObject({
      latitude: 40.71703581534977,
      longitude: -74.03457283319447,
      accuracy: 25.019,
      altitude: 22.27227783203125,
      altitudeAccuracy: 9.838127136230469,
      heading: 90,
      speed: 111,
    });
  });

  it("has a timestamp property", () => {
    expect(position.timestamp).toBe(1687923355537);
  });
});
