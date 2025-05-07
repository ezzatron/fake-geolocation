import {
  User,
  createAPIs,
  createPosition,
  createWrappedAPIs,
  type GeolocationObserver,
} from "fake-geolocation";
import type { PermissionStore } from "fake-permissions";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { coordsA, coordsB } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { expectGeolocationSuccess } from "./expect.js";

describe("createWrappedAPIs()", () => {
  const startTime = 100;

  let suppliedUser: User;
  let suppliedPermissionStore: PermissionStore;

  let geolocation: Geolocation;
  let observer: GeolocationObserver;
  let permissionStore: PermissionStore;
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
      userParams: {
        handleAccessRequest: async (dialog) => {
          dialog.remember(true);
          dialog.deny();
        },
      },
    });
    suppliedPermissionStore = supplied.permissionStore;
    suppliedUser = supplied.user;
    suppliedUser.jumpToCoordinates(coordsA);
    suppliedUser.grantAccess({ name: "geolocation" });

    const wrapped = createWrappedAPIs({
      geolocation: supplied.geolocation,
      permissions: supplied.permissions,
      userParams: {
        handleAccessRequest: async (dialog) => {
          dialog.remember(true);
          dialog.allow();
        },
      },
    });
    geolocation = wrapped.geolocation;
    observer = wrapped.observer;
    permissionStore = wrapped.permissionStore;
    permissions = wrapped.permissions;
    user = wrapped.user;
    selectAPIs = wrapped.selectAPIs;
    isUsingSuppliedAPIs = wrapped.isUsingSuppliedAPIs;
    user.jumpToCoordinates(coordsB);
    user.grantAccess({ name: "geolocation" });

    successCallback = vi.fn();
    errorCallback = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
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
      expect(await permissionStore.requestAccess({ name: "push" })).toBe(true);
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
      expect(
        await suppliedPermissionStore.requestAccess({ name: "push" }),
      ).toBe(false);
      expect((await permissions.query({ name: "push" })).state).toBe("denied");
    });

    it("observes the supplied Geolocation API", async () => {
      await expect(
        observer.waitForCoordinates(coordsA, async () => {
          suppliedUser.jumpToCoordinates(coordsA);
        }),
      ).resolves.toBeUndefined();
    });

    it("observes the supplied Permissions API", async () => {
      await expect(
        observer.waitForPermissionState("denied", async () => {
          suppliedUser.blockAccess({ name: "geolocation" });
        }),
      ).resolves.toBeUndefined();
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
        expect(await permissionStore.requestAccess({ name: "push" })).toBe(
          true,
        );
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
      expect(await permissionStore.requestAccess({ name: "push" })).toBe(true);
      expect((await permissions.query({ name: "push" })).state).toBe("granted");
    });

    it("observes the fake Geolocation API", async () => {
      await expect(
        observer.waitForCoordinates(coordsA, async () => {
          user.jumpToCoordinates(coordsA);
        }),
      ).resolves.toBeUndefined();
    });

    it("observes the fake Permissions API", async () => {
      await expect(
        observer.waitForPermissionState("denied", async () => {
          user.blockAccess({ name: "geolocation" });
        }),
      ).resolves.toBeUndefined();
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
        expect(
          await suppliedPermissionStore.requestAccess({ name: "push" }),
        ).toBe(false);
        expect((await permissions.query({ name: "push" })).state).toBe(
          "denied",
        );
      });
    });
  });
});
