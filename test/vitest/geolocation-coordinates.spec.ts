import {
  createCoordinates,
  type GeolocationCoordinatesParameters,
} from "fake-geolocation";
import { beforeEach, describe, expect, it } from "vitest";

describe("GeolocationCoordinates", () => {
  let params: GeolocationCoordinatesParameters;
  let coordinates: GeolocationCoordinates;

  beforeEach(() => {
    params = {
      latitude: 40.71703581534977,
      longitude: -74.03457283319447,
      altitude: 22.27227783203125,
      accuracy: 25.019,
      altitudeAccuracy: 9.838127136230469,
      heading: 90,
      speed: 111,
    };

    coordinates = createCoordinates(params);
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
    expect(coordinates).not.toBe(params);
  });

  it("has a latitude property", () => {
    expect(coordinates.latitude).toBe(40.71703581534977);
  });

  it("has a longitude property", () => {
    expect(coordinates.longitude).toBe(-74.03457283319447);
  });

  it("has an altitude property", () => {
    expect(coordinates.altitude).toBe(22.27227783203125);
  });

  it("has an accuracy property", () => {
    expect(coordinates.accuracy).toBe(25.019);
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

  it("has a toJSON method", () => {
    const json = coordinates.toJSON() as GeolocationCoordinatesParameters;

    expect(json).toEqual(params);
    expect(JSON.parse(JSON.stringify(coordinates))).toEqual(params);
  });

  it("has a toJSON method that handles NaN heading values", () => {
    // This test is pure speculation, as the Geolocation API spec does not yet
    // define how to handle NaN values for the heading property in toJSON().

    // A naive implementation would probably return NaN, which JSON.stringify()
    // would turn into a null. But this can't be distinguished from an actual
    // null, which indicates that heading information is not supported by
    // location services on the device.

    const coordinates = createCoordinates({ heading: NaN });

    const json = coordinates.toJSON() as GeolocationCoordinatesParameters;

    expect(json.heading).toBeNaN();
    expect(
      (
        JSON.parse(
          JSON.stringify(coordinates),
        ) as GeolocationCoordinatesParameters
      ).heading,
    ).toBeNull();
  });
});
