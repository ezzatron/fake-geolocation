import {
  createAPIs,
  createGeolocationObserver,
  PERMISSION_DENIED,
  type MutableLocationServices,
} from "fake-geolocation";
import type { PermissionStore } from "fake-permissions";
import { beforeEach, describe, expect, it } from "vitest";
import { coordsA } from "../../fixture/coords.js";

describe("PERMISSION_DENIED error caused by resetting the permission during an active watch", () => {
  let permissions: Permissions;
  let permissionStore: PermissionStore;
  let locationServices: MutableLocationServices;
  let geolocation: Geolocation;

  beforeEach(() => {
    ({ permissions, permissionStore, locationServices, geolocation } =
      createAPIs());
  });

  it("doesn't regress", async () => {
    locationServices.setLowAccuracyCoordinates(coordsA);
    permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
    await runTaskQueue();
    const observer = createGeolocationObserver(geolocation, permissions);
    await runTaskQueue();

    await expect(
      observer.waitForPositionError(PERMISSION_DENIED, async () => {
        permissionStore.setStatus({ name: "geolocation" }, "PROMPT");
      }),
    ).resolves.toBeUndefined();
  });
});

async function runTaskQueue(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });
}
