import { jest } from "@jest/globals";
import { HandlePermissionRequest } from "fake-permissions";
import {
  User,
  createAPIs,
  createPosition,
  createWrappedAPIs,
} from "../../src/index.js";
import { coordsA, coordsB } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { expectGeolocationSuccess } from "./expect.js";

describe("createWrappedAPIs()", () => {
  const startTime = 100;

  let suppliedHandlePermissionRequest: jest.Mock<HandlePermissionRequest>;
  let suppliedUser: User;

  let handlePermissionRequest: jest.Mock<HandlePermissionRequest>;
  let geolocation: Geolocation;
  let permissions: Permissions;
  let user: User;
  let selectAPIs: (useSuppliedAPIs: boolean) => void;
  let isUsingSuppliedAPIs: () => boolean;

  let successCallback: jest.Mock;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    jest.setSystemTime(startTime);

    suppliedHandlePermissionRequest = jest.fn<HandlePermissionRequest>(
      () => "denied",
    );
    const supplied = createAPIs({
      handlePermissionRequest: suppliedHandlePermissionRequest,
    });
    suppliedUser = supplied.user;
    suppliedUser.jumpToCoordinates(coordsA);
    suppliedUser.grantPermission({ name: "geolocation" });

    handlePermissionRequest = jest.fn<HandlePermissionRequest>(() => "granted");
    const wrapped = createWrappedAPIs({
      geolocation: supplied.geolocation,
      permissions: supplied.permissions,
      handlePermissionRequest,
    });
    geolocation = wrapped.geolocation;
    permissions = wrapped.permissions;
    user = wrapped.user;
    selectAPIs = wrapped.selectAPIs;
    isUsingSuppliedAPIs = wrapped.isUsingSuppliedAPIs;
    user.jumpToCoordinates(coordsB);
    user.grantPermission({ name: "geolocation" });

    successCallback = jest.fn();
    errorCallback = jest.fn();
  });

  describe("before selecting APIs", () => {
    it("has selected the fake APIs", () => {
      expect(isUsingSuppliedAPIs()).toBe(false);
    });

    it("delegates to the fake Geolocation API", async () => {
      await getCurrentPosition(geolocation, successCallback, errorCallback);

      expectGeolocationSuccess(
        successCallback,
        errorCallback,
        createPosition(coordsB, startTime, false),
      );
    });

    it("delegates to the fake Permissions API", async () => {
      await user.requestPermission({ name: "push" });

      expect((await permissions.query({ name: "push" })).state).toBe("granted");
    });
  });

  describe("after selecting the supplied APIs", () => {
    beforeEach(() => {
      selectAPIs(true);
    });

    it("has selected the supplied APIs", () => {
      expect(isUsingSuppliedAPIs()).toBe(true);
    });

    it("delegates to the supplied Geolocation API", async () => {
      await getCurrentPosition(geolocation, successCallback, errorCallback);

      expectGeolocationSuccess(
        successCallback,
        errorCallback,
        createPosition(coordsA, startTime, false),
      );
    });

    it("delegates to the supplied Permissions API", async () => {
      await suppliedUser.requestPermission({ name: "push" });

      expect((await permissions.query({ name: "push" })).state).toBe("denied");
    });

    describe("after selecting the fake APIs", () => {
      beforeEach(() => {
        selectAPIs(false);
      });

      it("delegates to the fake Geolocation API", async () => {
        await getCurrentPosition(geolocation, successCallback, errorCallback);

        expectGeolocationSuccess(
          successCallback,
          errorCallback,
          createPosition(coordsB, startTime, false),
        );
      });

      it("delegates to the fake Permissions API", async () => {
        await user.requestPermission({ name: "push" });

        expect((await permissions.query({ name: "push" })).state).toBe(
          "granted",
        );
      });
    });
  });

  describe("after selecting the fake APIs", () => {
    beforeEach(() => {
      selectAPIs(false);
    });

    it("has selected the fake APIs", () => {
      expect(isUsingSuppliedAPIs()).toBe(false);
    });

    it("delegates to the fake Geolocation API", async () => {
      await getCurrentPosition(geolocation, successCallback, errorCallback);

      expectGeolocationSuccess(
        successCallback,
        errorCallback,
        createPosition(coordsB, startTime, false),
      );
    });

    it("delegates to the fake Permissions API", async () => {
      await user.requestPermission({ name: "push" });

      expect((await permissions.query({ name: "push" })).state).toBe("granted");
    });

    describe("after selecting the supplied APIs", () => {
      beforeEach(() => {
        selectAPIs(true);
      });

      it("delegates to the supplied Geolocation API", async () => {
        await getCurrentPosition(geolocation, successCallback, errorCallback);

        expectGeolocationSuccess(
          successCallback,
          errorCallback,
          createPosition(coordsA, startTime, false),
        );
      });

      it("delegates to the supplied Permissions API", async () => {
        await suppliedUser.requestPermission({ name: "push" });

        expect((await permissions.query({ name: "push" })).state).toBe(
          "denied",
        );
      });
    });
  });
});
