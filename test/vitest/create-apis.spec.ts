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
      userParams: {
        handleAccessRequest: async (dialog) => {
          dialog.remember(true);
          dialog.allow();
        },
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

  it("creates an observer for the APIs", async () => {
    const { geolocation, observer, permissions, user } = createAPIs();

    await expect(
      observer.waitForPermissionState("granted", async () => {
        user.grantAccess({ name: "geolocation" });
      }),
    ).resolves.toBeUndefined();
    expect((await permissions.query({ name: "geolocation" })).state).toBe(
      "granted",
    );

    await expect(
      observer.waitForCoordinates(coordsA, async () => {
        user.jumpToCoordinates(coordsA);
      }),
    ).resolves.toBeUndefined();

    const successCallback = vi.fn();
    await getCurrentPosition(geolocation, successCallback);

    expect(successCallback).toBeCalledWith(
      expect.objectContaining({ coords: coordsA, timestamp: startTime }),
    );
  });
});
