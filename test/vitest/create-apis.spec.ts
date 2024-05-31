import { createAPIs } from "fake-geolocation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { coordsA } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { mockFn } from "../helpers.js";

describe("createAPIs()", () => {
  const startTime = 100;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);
  });

  it("creates APIs that handle permission requests for geolocation", async () => {
    const { geolocation, permissions, user } = createAPIs({
      handlePermissionRequest: () => "granted",
    });
    user.jumpToCoordinates(coordsA);

    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "prompt",
    );

    await getCurrentPosition(geolocation, mockFn());

    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "granted",
    );
  });
});
