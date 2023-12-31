import { jest } from "@jest/globals";
import { createPermissionStore, createPermissions } from "fake-permissions";
import {
  GeolocationPositionError,
  MutableLocationServices,
  User,
  createGeolocation,
  createLocationServices,
  createPermissionDeniedError,
  createPositionUnavailableError,
  createUser,
  waitForPositionError,
} from "../../src/index.js";
import { coordsA, coordsB } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { expectGeolocationError } from "./expect.js";

describe("waitForPositionError()", () => {
  const startTime = 100;
  let locationServices: MutableLocationServices;
  let permissions: Permissions;
  let user: User;
  let geolocation: Geolocation;

  let successCallback: jest.Mock;
  let errorCallback: jest.Mock;

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

    successCallback = jest.fn();
    errorCallback = jest.fn();
  });

  describe("when called without a code", () => {
    it("watches the position until an error is produced", async () => {
      const promise = waitForPositionError(geolocation).then(() =>
        getCurrentPosition(geolocation, successCallback, errorCallback),
      );

      await new Promise((resolve) => setTimeout(resolve, 20));
      user.jumpToCoordinates(coordsB);
      await new Promise((resolve) => setTimeout(resolve, 20));
      successCallback.mockClear();
      errorCallback.mockClear();
      locationServices.setHighAccuracyCoordinates(undefined);
      locationServices.setLowAccuracyCoordinates(undefined);

      await expect(promise).resolves.toBeUndefined();
      expectGeolocationError(
        successCallback,
        errorCallback,
        createPositionUnavailableError(""),
      );
    });
  });

  describe("when called with a code", () => {
    it("watches the position until an error with a matching code is produced", async () => {
      const promise = waitForPositionError(
        geolocation,
        GeolocationPositionError.PERMISSION_DENIED,
      ).then(() =>
        getCurrentPosition(geolocation, successCallback, errorCallback),
      );

      await new Promise((resolve) => setTimeout(resolve, 20));
      user.jumpToCoordinates(coordsB);
      await new Promise((resolve) => setTimeout(resolve, 20));
      locationServices.setHighAccuracyCoordinates(undefined);
      locationServices.setLowAccuracyCoordinates(undefined);
      await new Promise((resolve) => setTimeout(resolve, 20));
      successCallback.mockClear();
      errorCallback.mockClear();
      user.jumpToCoordinates(coordsB);
      user.denyPermission({ name: "geolocation" });

      await expect(promise).resolves.toBeUndefined();
      expectGeolocationError(
        successCallback,
        errorCallback,
        createPermissionDeniedError(""),
      );
    });
  });
});
