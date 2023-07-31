import { errorMessage } from "../../src/error.js";

describe("errorMessage()", () => {
  describe("when called with an Error", () => {
    it("returns the error's message", () => {
      expect(errorMessage(new Error("<message>"))).toBe("<message>");
    });
  });

  describe("when called with a string", () => {
    it("returns the string", () => {
      expect(errorMessage("<message>")).toBe("<message>");
    });
  });

  describe("when called with anything else", () => {
    it("returns a generic message", () => {
      expect(errorMessage({})).toBe("An error occurred");
    });
  });
});
