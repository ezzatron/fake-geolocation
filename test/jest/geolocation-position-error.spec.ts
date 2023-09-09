import { createPositionUnavailableError } from "../../src/index.js";

describe("GeolocationPositionError", () => {
  let error: GeolocationPositionError;

  beforeEach(() => {
    error = createPositionUnavailableError("<message>");
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (error.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });

  it("does not extend Error", () => {
    expect(error).not.toBeInstanceOf(Error);
  });

  it("has no name property", () => {
    expect("name" in error).toBe(false);
  });

  it("has no stack property", () => {
    expect("stack" in error).toBe(false);
  });

  it("has a message property", () => {
    expect(typeof error.message).toBe("string");
  });
});
