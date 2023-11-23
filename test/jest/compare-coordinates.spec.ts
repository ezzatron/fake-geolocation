import { compareCoordinates } from "../../src/index.js";
import { coordsA, coordsB, coordsC, coordsD } from "../fixture/coords.js";

describe("compareCoordinates()", () => {
  it("sorts coordinates when used as a comparator", () => {
    expect(
      [coordsA, coordsB, coordsC, coordsD].sort(compareCoordinates),
    ).toEqual([coordsB, coordsD, coordsA, coordsC]);
  });
});
