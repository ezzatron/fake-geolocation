/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GeolocationCoordinatesParameters } from "fake-geolocation";
import { describe, expectTypeOf, it } from "vitest";

describe("GeolocationCoordinatesParameters", () => {
  it("accepts the same properties as GeolocationCoordinates", () => {
    expectTypeOf<GeolocationCoordinatesParameters>().toEqualTypeOf<{
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    }>(undefined as any); // weird that this is necessary
  });
});
