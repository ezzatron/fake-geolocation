import { createAPIs } from "../../../src/index.js";

describe("Geolocation", () => {
  let geolocation: Geolocation;

  beforeEach(() => {
    ({ geolocation } = createAPIs());
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });
});
