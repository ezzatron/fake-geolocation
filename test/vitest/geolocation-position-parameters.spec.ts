/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GeolocationPositionParameters } from "fake-geolocation";
import { describe, expectTypeOf, it } from "vitest";

describe("GeolocationPositionParameters", () => {
  it("accepts the same properties as GeolocationPosition", () => {
    expectTypeOf<GeolocationPositionParameters>().toEqualTypeOf<{
      coords: {
        latitude: number;
        longitude: number;
        altitude: number | null;
        accuracy: number;
        altitudeAccuracy: number | null;
        heading: number | null;
        speed: number | null;
      };
      timestamp: number;
    }>(undefined as any); // weird that this is necessary
  });
});
