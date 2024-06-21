import {
  GeolocationCoordinates,
  GeolocationPosition,
  createPosition,
} from "fake-geolocation";
import { describe, expect, it } from "vitest";
import { isHighAccuracy } from "../../src/geolocation-position.js";

describe("createPosition()", () => {
  describe("when all arguments and properties are provided", () => {
    const coordsProperties = {
      latitude: 11,
      longitude: 22,
      altitude: 33,
      accuracy: 44,
      altitudeAccuracy: 55,
      heading: 66,
      speed: 77,
    } as const;

    it("creates a position", () => {
      const position = createPosition(coordsProperties, 88, false);

      expect(position).toBeInstanceOf(GeolocationPosition);
      expect(position.coords).toBeInstanceOf(GeolocationCoordinates);
      expect(position).toEqual({
        coords: {
          latitude: 11,
          longitude: 22,
          altitude: 33,
          accuracy: 44,
          altitudeAccuracy: 55,
          heading: 66,
          speed: 77,
          [Symbol.toStringTag]: "GeolocationCoordinates",
        },
        timestamp: 88,
        [Symbol.toStringTag]: "GeolocationPosition",
      });
      expect(isHighAccuracy(position)).toBe(false);
    });
  });

  describe("when some arguments and properties are provided", () => {
    const coordsProperties = {
      latitude: 11,
      longitude: 22,
      accuracy: 33,
    } as const;

    it("creates a position", () => {
      const position = createPosition(coordsProperties);

      expect(position).toBeInstanceOf(GeolocationPosition);
      expect(position.coords).toBeInstanceOf(GeolocationCoordinates);
      expect(position).toEqual({
        coords: {
          latitude: 11,
          longitude: 22,
          altitude: null,
          accuracy: 33,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          [Symbol.toStringTag]: "GeolocationCoordinates",
        },
        timestamp: 0,
        [Symbol.toStringTag]: "GeolocationPosition",
      });
      expect(isHighAccuracy(position)).toBe(true);
    });
  });

  describe("when no arguments or properties are provided", () => {
    it("creates a position", () => {
      const position = createPosition();

      expect(position).toBeInstanceOf(GeolocationPosition);
      expect(position.coords).toBeInstanceOf(GeolocationCoordinates);
      expect(position).toEqual({
        coords: {
          latitude: 0,
          longitude: 0,
          altitude: null,
          accuracy: 0,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          [Symbol.toStringTag]: "GeolocationCoordinates",
        },
        timestamp: 0,
        [Symbol.toStringTag]: "GeolocationPosition",
      });
      expect(isHighAccuracy(position)).toBe(true);
    });
  });
});
