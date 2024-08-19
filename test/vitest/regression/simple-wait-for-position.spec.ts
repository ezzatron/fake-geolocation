import { createAPIs } from "fake-geolocation";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { coordsA, coordsB } from "../../fixture/coords.js";

describe("Simple waitForPosition regression", () => {
  let fakeAPIs: ReturnType<typeof createAPIs>;
  let successCallback: Mock<PositionCallback>;

  beforeEach(async () => {
    fakeAPIs = createAPIs({
      handleAccessRequest: async (dialog) => {
        // Nothing in this test should trigger an access request
        dialog.remember(true);
        dialog.deny();
      },
    });
    fakeAPIs.user.grantAccess({ name: "geolocation" });
    fakeAPIs.user.jumpToCoordinates(coordsA);

    await fakeAPIs.observer.waitForCoordinates(coordsA);

    successCallback = vi.fn();
    fakeAPIs.geolocation.watchPosition(successCallback);
  });

  describe("when the position changes", () => {
    beforeEach(async () => {
      successCallback.mockClear();
      fakeAPIs.user.jumpToCoordinates(coordsB);
      await fakeAPIs.observer.waitForCoordinates(coordsB);
    });

    it("doesn't regress", () => {
      expect(successCallback).toBeCalledWith(
        expect.objectContaining({
          coords: coordsB,
        }),
      );
    });
  });
});
