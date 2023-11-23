import { jest } from "@jest/globals";
import { createPermissionStore, createPermissions } from "fake-permissions";
import {
  MutableLocationServices,
  User,
  createGeolocation,
  createLocationServices,
  createUser,
  waitForCoordinates,
} from "../../src/index.js";
import { coordsA, coordsB, coordsC } from "../fixture/coords.js";

describe("waitForCoordinates()", () => {
  const startTime = 100;
  let locationServices: MutableLocationServices;
  let permissions: Permissions;
  let user: User;
  let geolocation: Geolocation;

  beforeEach(() => {
    jest.setSystemTime(startTime);

    locationServices = createLocationServices();

    const permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "granted"]]),
    });

    permissions = createPermissions({ permissionStore });

    user = createUser({ locationServices, permissionStore });
    user.jumpToCoordinates(coordsA);

    geolocation = createGeolocation({
      locationServices,
      permissions,

      async requestPermission(descriptor) {
        return user.requestPermission(descriptor);
      },
    });
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
