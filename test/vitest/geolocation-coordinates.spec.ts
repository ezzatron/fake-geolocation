import { createCoordinates } from "fake-geolocation";
import { beforeEach, describe, expect, it } from "vitest";

describe("GeolocationCoordinates", () => {
  let input: GeolocationCoordinates;
  let coordinates: GeolocationCoordinates;

  beforeEach(() => {
    input = {
      latitude: 40.71703581534977,
      longitude: -74.03457283319447,
      accuracy: 25.019,
      altitude: 22.27227783203125,
      altitudeAccuracy: 9.838127136230469,
      heading: 90,
      speed: 111,
    };

    coordinates = createCoordinates(input);
  });

  it("has a string tag", () => {
    expect(Object.prototype.toString.call(coordinates)).toBe(
      "[object GeolocationCoordinates]",
    );
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (coordinates.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  it("copies the coords", () => {
    expect(coordinates).not.toBe(input);
  });

  it("has a latitude property", () => {
    expect(coordinates.latitude).toBe(40.71703581534977);
  });

  it("has a longitude property", () => {
    expect(coordinates.longitude).toBe(-74.03457283319447);
  });

  it("has an accuracy property", () => {
    expect(coordinates.accuracy).toBe(25.019);
  });

  it("has an altitude property", () => {
    expect(coordinates.altitude).toBe(22.27227783203125);
  });

  it("has an altitudeAccuracy property", () => {
    expect(coordinates.altitudeAccuracy).toBe(9.838127136230469);
  });

  it("has a heading property", () => {
    expect(coordinates.heading).toBe(90);
  });

  it("has a speed property", () => {
    expect(coordinates.speed).toBe(111);
  });
});
