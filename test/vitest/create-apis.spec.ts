import { createAPIs } from "fake-geolocation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coordsA } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";

describe("createAPIs()", () => {
  const startTime = 100;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates APIs that handle access requests for geolocation", async () => {
    const { geolocation, permissions, user } = createAPIs({
      handleAccessRequest: async (dialog) => {
        dialog.allow(true);
      },
    });
    user.jumpToCoordinates(coordsA);

    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "prompt",
    );

    await getCurrentPosition(geolocation, vi.fn());

    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "granted",
    );
  });
});
