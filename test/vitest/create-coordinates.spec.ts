import { createCoordinates, GeolocationCoordinates } from "fake-geolocation";
import { describe, expect, it } from "vitest";

describe("createCoordinates()", () => {
  describe("when all properties are provided", () => {
    const properties = {
      latitude: 11,
      longitude: 22,
      altitude: 33,
      accuracy: 44,
      altitudeAccuracy: 55,
      heading: 66,
      speed: 77,
    } as const;

    it("creates coordinates", () => {
      const coords = createCoordinates(properties);

      expect(coords).toBeInstanceOf(GeolocationCoordinates);
      expect(coords).toEqual({
        latitude: 11,
        longitude: 22,
        altitude: 33,
        accuracy: 44,
        altitudeAccuracy: 55,
        heading: 66,
        speed: 77,
        [Symbol.toStringTag]: "GeolocationCoordinates",
      });
    });
  });

  describe("when some properties are provided", () => {
    const properties = {
      latitude: 11,
      longitude: 22,
      accuracy: 33,
    } as const;

    it("creates coordinates", () => {
      const coords = createCoordinates(properties);

      expect(coords).toBeInstanceOf(GeolocationCoordinates);
      expect(coords).toEqual({
        latitude: 11,
        longitude: 22,
        altitude: null,
        accuracy: 33,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        [Symbol.toStringTag]: "GeolocationCoordinates",
      });
    });
  });

  describe("when no properties are provided", () => {
    it("creates coordinates", () => {
      const coords = createCoordinates();

      expect(coords).toBeInstanceOf(GeolocationCoordinates);
      expect(coords).toEqual({
        latitude: 0,
        longitude: 0,
        altitude: null,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        [Symbol.toStringTag]: "GeolocationCoordinates",
      });
    });
  });

  describe("when explicit undefined properties are provided", () => {
    const properties = {
      latitude: undefined,
      longitude: undefined,
      accuracy: undefined,
      altitude: undefined,
      altitudeAccuracy: undefined,
      heading: undefined,
      speed: undefined,
    } as const;

    it("creates coordinates", () => {
      const coords = createCoordinates(properties);

      expect(coords).toBeInstanceOf(GeolocationCoordinates);
      expect(coords).toEqual({
        latitude: 0,
        longitude: 0,
        altitude: null,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        [Symbol.toStringTag]: "GeolocationCoordinates",
      });
    });
  });
});
