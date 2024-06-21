import { createAPIs } from "fake-geolocation";
import { beforeEach, describe, expect, it } from "vitest";

describe("Geolocation", () => {
  let geolocation: Geolocation;

  beforeEach(() => {
    ({ geolocation } = createAPIs());
  });

  it("has a string tag", () => {
    expect(Object.prototype.toString.call(geolocation)).toBe(
      "[object Geolocation]",
    );
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });
});
