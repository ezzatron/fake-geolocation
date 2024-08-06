import {
  MutableLocationServices,
  User,
  createGeolocation,
  createLocationServices,
  createUser,
  waitForCoordinates,
} from "fake-geolocation";
import { createPermissionStore } from "fake-permissions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coordsA, coordsB, coordsC } from "../fixture/coords.js";

describe("waitForCoordinates()", () => {
  const startTime = 100;
  let locationServices: MutableLocationServices;
  let user: User;
  let geolocation: Geolocation;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);

    locationServices = createLocationServices();

    const permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "granted"]]),
    });

    user = createUser({ locationServices, permissionStore });
    user.jumpToCoordinates(coordsA);

    geolocation = createGeolocation({
      locationServices,
      permissionStore,
      user,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("watches the position until the coordinates match the supplied coordinates", async () => {
    const promise = waitForCoordinates(geolocation, coordsC).then(() =>
      locationServices.acquireCoordinates(true),
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    user.jumpToCoordinates(coordsB);
    await new Promise((resolve) => setTimeout(resolve, 20));
    user.jumpToCoordinates(coordsC);

    await expect(promise).resolves.toEqual(coordsC);
  });
});
