import { jest } from "@jest/globals";
import { createAPIs } from "../../src/create-apis.js";
import { coordsA } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";

describe("createAPIs()", () => {
  const startTime = 100;

  beforeEach(() => {
    jest.setSystemTime(startTime);
  });

  it("creates APIs that handle permission requests for geolocation", async () => {
    const { geolocation, permissions, user } = createAPIs({
      handlePermissionRequest: () => "granted",
    });
    user.jumpToCoordinates(coordsA);

    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "prompt",
    );

    await getCurrentPosition(geolocation, jest.fn());

    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "granted",
    );
  });
});
