import { jest } from "@jest/globals";
import {
  HandlePermissionRequest,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import {
  User,
  createGeolocation,
  createLocationServices,
  createPosition,
  createUser,
  createWrappedAPIs,
} from "../../src/index.js";
import { StdGeolocation } from "../../src/types/std.js";
import { coordsA, coordsB } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { expectGeolocationSuccess } from "./expect.js";

describe("createWrappedAPIs()", () => {
  const startTime = 100;

  let handleSuppliedPermissionRequest: jest.Mock<HandlePermissionRequest>;
  let suppliedUser: User;
  let suppliedGeolocation: StdGeolocation;
  let suppliedPermissions: Permissions;

  let handleFakePermissionRequest: jest.Mock<HandlePermissionRequest>;
  let wrappedUser: User;
  let wrappedGeolocation: StdGeolocation;
  let wrappedPermissions: Permissions;

  let selectAPIs: (useSuppliedAPIs: boolean) => void;

  let successCallback: jest.Mock;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    jest.setSystemTime(startTime);

    handleSuppliedPermissionRequest = jest.fn<HandlePermissionRequest>();

    const suppliedLocationServices = createLocationServices();
    const suppliedPermissionStore = createPermissionStore({
      initialStates: new Map([
        [{ name: "geolocation" }, "granted"],
        [{ name: "notifications" }, "granted"],
        [{ name: "push" }, "granted"],
      ]),
    });

    suppliedPermissions = createPermissions({
      permissionStore: suppliedPermissionStore,
    });

    suppliedUser = createUser({
      handlePermissionRequest: handleSuppliedPermissionRequest,
      locationServices: suppliedLocationServices,
      permissionStore: suppliedPermissionStore,
    });

    suppliedGeolocation = createGeolocation({
      locationServices: suppliedLocationServices,
      permissions: suppliedPermissions,

      async requestPermission(descriptor) {
        return suppliedUser.requestPermission(descriptor);
      },
    });

    suppliedUser.jumpToCoordinates(coordsA);

    handleFakePermissionRequest = jest.fn<HandlePermissionRequest>();

    ({
      geolocation: wrappedGeolocation,
      permissions: wrappedPermissions,
      selectAPIs,
      user: wrappedUser,
    } = createWrappedAPIs({
      geolocation: suppliedGeolocation,
      permissions: suppliedPermissions,
      handlePermissionRequest: handleFakePermissionRequest,
    }));

    wrappedUser.grantPermission({ name: "geolocation" });
    wrappedUser.jumpToCoordinates(coordsB);

    successCallback = jest.fn();
    errorCallback = jest.fn();
  });

  describe("before selecting APIs", () => {
    it("delegates to the fake Geolocation API", async () => {
      await getCurrentPosition(
        wrappedGeolocation,
        successCallback,
        errorCallback,
      );

      expectGeolocationSuccess(
        successCallback,
        errorCallback,
        createPosition(coordsB, startTime, false),
      );
    });

    it("delegates to the fake Permissions API", async () => {
      expect(
        (await wrappedPermissions.query({ name: "geolocation" })).state,
      ).toBe("granted");
    });
  });

  describe("after selecting the supplied APIs", () => {
    beforeEach(() => {
      selectAPIs(true);
    });

    it("delegates to the supplied Geolocation API", async () => {
      await getCurrentPosition(
        wrappedGeolocation,
        successCallback,
        errorCallback,
      );

      expectGeolocationSuccess(
        successCallback,
        errorCallback,
        createPosition(coordsA, startTime, false),
      );
    });

    it("delegates to the supplied Permissions API", async () => {
      suppliedUser.denyPermission({ name: "geolocation" });

      expect(
        (await wrappedPermissions.query({ name: "geolocation" })).state,
      ).toBe("denied");
    });

    describe("after selecting the fake APIs", () => {
      beforeEach(() => {
        selectAPIs(false);
      });

      it("delegates to the fake Geolocation API", async () => {
        await getCurrentPosition(
          wrappedGeolocation,
          successCallback,
          errorCallback,
        );

        expectGeolocationSuccess(
          successCallback,
          errorCallback,
          createPosition(coordsB, startTime, false),
        );
      });

      it("delegates to the fake Permissions API", async () => {
        expect(
          (await wrappedPermissions.query({ name: "geolocation" })).state,
        ).toBe("granted");
      });
    });
  });

  describe("after selecting the fake APIs", () => {
    beforeEach(() => {
      selectAPIs(false);
    });

    it("delegates to the fake Geolocation API", async () => {
      await getCurrentPosition(
        wrappedGeolocation,
        successCallback,
        errorCallback,
      );

      expectGeolocationSuccess(
        successCallback,
        errorCallback,
        createPosition(coordsB, startTime, false),
      );
    });

    it("delegates to the fake Permissions API", async () => {
      expect(
        (await wrappedPermissions.query({ name: "geolocation" })).state,
      ).toBe("granted");
    });

    describe("after selecting the supplied APIs", () => {
      beforeEach(() => {
        selectAPIs(true);
      });

      it("delegates to the supplied Geolocation API", async () => {
        await getCurrentPosition(
          wrappedGeolocation,
          successCallback,
          errorCallback,
        );

        expectGeolocationSuccess(
          successCallback,
          errorCallback,
          createPosition(coordsA, startTime, false),
        );
      });

      it("delegates to the supplied Permissions API", async () => {
        suppliedUser.denyPermission({ name: "geolocation" });

        expect(
          (await wrappedPermissions.query({ name: "geolocation" })).state,
        ).toBe("denied");
      });
    });
  });
});
