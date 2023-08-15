import {
  MutableLocationServices,
  createGeolocation,
  createLocationServices,
} from "../../../src/index.js";
import { StdGeolocation } from "../../../src/types/std.js";

describe("Geolocation", () => {
  let locationServices: MutableLocationServices;
  let geolocation: StdGeolocation;

  beforeEach(() => {
    locationServices = createLocationServices();
    geolocation = createGeolocation({ locationServices });
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });
});
