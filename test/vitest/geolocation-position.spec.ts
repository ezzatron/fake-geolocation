import { createCoordinates, createPosition } from "fake-geolocation";
import { beforeEach, describe, expect, it } from "vitest";

describe("GeolocationPosition", () => {
  let coords: GeolocationCoordinates;
  let position: GeolocationPosition;

  beforeEach(() => {
    coords = createCoordinates({
      latitude: 40.71703581534977,
      longitude: -74.03457283319447,
      altitude: 22.27227783203125,
      accuracy: 25.019,
      altitudeAccuracy: 9.838127136230469,
      heading: 90,
      speed: 111,
    });

    position = createPosition(coords, 1687923355537, true);
  });

  it("has a string tag", () => {
    expect(Object.prototype.toString.call(position)).toBe(
      "[object GeolocationPosition]",
    );
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
      altitude: 22.27227783203125,
      accuracy: 25.019,
      altitudeAccuracy: 9.838127136230469,
      heading: 90,
      speed: 111,
    });
  });

  it("has a timestamp property", () => {
    expect(position.timestamp).toBe(1687923355537);
  });

  it("has a toJSON method", () => {
    const json = position.toJSON() as object;

    expect(json).toEqual({
      coords: {
        latitude: 40.71703581534977,
        longitude: -74.03457283319447,
        altitude: 22.27227783203125,
        accuracy: 25.019,
        altitudeAccuracy: 9.838127136230469,
        heading: 90,
        speed: 111,
      },
      timestamp: 1687923355537,
    });
    expect(JSON.parse(JSON.stringify(position))).toEqual(json);
  });
});
