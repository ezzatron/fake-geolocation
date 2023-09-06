import { createStandardAPIs } from "../../../src/index.js";
import { StdGeolocation } from "../../../src/types/std.js";

describe("Geolocation", () => {
  let geolocation: StdGeolocation;

  beforeEach(() => {
    ({ geolocation } = createStandardAPIs());
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });
});
