import {
  User,
  createAPIs,
  createPosition,
  createWrappedAPIs,
} from "fake-geolocation";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { coordsA, coordsB } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { expectGeolocationSuccess } from "./expect.js";

describe("createWrappedAPIs()", () => {
  const startTime = 100;

  let suppliedUser: User;

  let geolocation: Geolocation;
  let permissions: Permissions;
  let user: User;
  let selectAPIs: (useSuppliedAPIs: boolean) => void;
  let isUsingSuppliedAPIs: () => boolean;

  let successCallback: Mock<PositionCallback>;
  let errorCallback: Mock<PositionErrorCallback>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);

    const supplied = createAPIs({
      handleAccessRequest: async (dialog) => {
        dialog.deny(true);
      },
    });
    suppliedUser = supplied.user;
    suppliedUser.jumpToCoordinates(coordsA);
    suppliedUser.grantPermission({ name: "geolocation" });

    const wrapped = createWrappedAPIs({
      geolocation: supplied.geolocation,
      permissions: supplied.permissions,
      handleAccessRequest: async (dialog) => {
        dialog.allow(true);
      },
    });
    geolocation = wrapped.geolocation;
    permissions = wrapped.permissions;
    user = wrapped.user;
    selectAPIs = wrapped.selectAPIs;
    isUsingSuppliedAPIs = wrapped.isUsingSuppliedAPIs;
    user.jumpToCoordinates(coordsB);
    user.grantPermission({ name: "geolocation" });

    successCallback = vi.fn();
    errorCallback = vi.fn();
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
      expect(await user.requestAccess({ name: "push" })).toBe(true);
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
      expect(await suppliedUser.requestAccess({ name: "push" })).toBe(false);
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
        expect(await user.requestAccess({ name: "push" })).toBe(true);
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
      expect(await user.requestAccess({ name: "push" })).toBe(true);
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
        expect(await suppliedUser.requestAccess({ name: "push" })).toBe(false);
        expect((await permissions.query({ name: "push" })).state).toBe(
          "denied",
        );
      });
    });
  });
});
