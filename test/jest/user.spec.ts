import { jest } from "@jest/globals";
import {
  PermissionStore,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { sleep } from "../../src/async.js";
import {
  MutableLocationServices,
  User,
  createGeolocation,
  createLocationServices,
  createPosition,
  createUser,
} from "../../src/index.js";
import { coordsA, coordsB } from "../fixture/coords.js";
import { waitFor } from "../wait-for.js";
import { expectGeolocationSuccess } from "./expect.js";

describe("User", () => {
  let locationServices: MutableLocationServices;
  let permissionStore: PermissionStore;
  let user: User;

  beforeEach(() => {
    locationServices = createLocationServices();
    permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "prompt"]]),
    });

    user = createUser({ locationServices, permissionStore });
  });

  describe("when location services is enabled", () => {
    beforeEach(() => {
      locationServices.enable();
    });

    describe("when disabling location services", () => {
      beforeEach(() => {
        user.disableLocationServices();
      });

      it("disables location services", () => {
        expect(locationServices.isEnabled).toBe(false);
      });
    });

    describe("when enabling location services", () => {
      beforeEach(() => {
        user.enableLocationServices();
      });

      it("leaves location services enabled", () => {
        expect(locationServices.isEnabled).toBe(true);
      });
    });
  });

  describe("when location services is disabled", () => {
    beforeEach(() => {
      locationServices.disable();
    });

    describe("when enabling location services", () => {
      beforeEach(() => {
        user.enableLocationServices();
      });

      it("enables location services", () => {
        expect(locationServices.isEnabled).toBe(true);
      });
    });

    describe("when disabling location services", () => {
      beforeEach(() => {
        user.disableLocationServices();
      });

      it("leaves location services diabled", () => {
        expect(locationServices.isEnabled).toBe(false);
      });
    });
  });

  describe("when no low-accuracy transform is configured", () => {
    beforeEach(() => {
      user = createUser({ locationServices, permissionStore });
    });

    describe("when jumping to coordinates", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      it("updates the high-accuracy coordinates to match the supplied coordinates", async () => {
        expect(await locationServices.acquireCoordinates(true)).toEqual(
          coordsA,
        );
      });

      it("updates the low-accuracy coordinates to match the supplied coordinates", async () => {
        expect(await locationServices.acquireCoordinates(false)).toEqual(
          coordsA,
        );
      });
    });
  });

  describe("when a low-accuracy transform is configured", () => {
    beforeEach(() => {
      user = createUser({
        locationServices,
        permissionStore,

        lowAccuracyTransform(coords) {
          return {
            ...coords,
            accuracy: 111111,
            altitudeAccuracy: 222222,
          };
        },
      });
    });

    describe("when jumping to coordinates", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      it("updates the high-accuracy coordinates to match the supplied coordinates", async () => {
        expect(await locationServices.acquireCoordinates(true)).toEqual(
          coordsA,
        );
      });

      it("updates the low-accuracy coordinates to match the transformed coordinates", async () => {
        expect(await locationServices.acquireCoordinates(false)).toEqual({
          latitude: 40.71703581534977,
          longitude: -74.03457283319447,
          accuracy: 111111,
          altitude: 22.27227783203125,
          altitudeAccuracy: 222222,
          heading: null,
          speed: null,
        });
      });
    });
  });

  describe("when providing partial coordinates", () => {
    beforeEach(() => {
      user.jumpToCoordinates({});
    });

    it("fills in the missing data", async () => {
      expect(await locationServices.acquireCoordinates(true)).toEqual({
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      });
    });
  });

  describe("when taking a journey", () => {
    const startTime = 100;
    const delay = 40;
    const watchIds: number[] = [];
    let geolocation: Geolocation;

    let highAccuracySuccessCallback: jest.Mock;
    let highAccuracyErrorCallback: jest.Mock;
    let lowAccuracySuccessCallback: jest.Mock;
    let lowAccuracyErrorCallback: jest.Mock;

    beforeEach(async () => {
      jest.setSystemTime(startTime);

      user = createUser({
        locationServices,
        permissionStore,

        lowAccuracyTransform(coords) {
          return {
            ...coords,
            accuracy: 111111,
            altitudeAccuracy: 222222,
          };
        },
      });
      user.grantPermission({ name: "geolocation" });

      geolocation = createGeolocation({
        locationServices,
        permissions: createPermissions({ permissionStore }),

        async requestPermission(descriptor) {
          return user.requestPermission(descriptor);
        },
      });

      highAccuracySuccessCallback = jest.fn();
      highAccuracyErrorCallback = jest.fn();
      lowAccuracySuccessCallback = jest.fn();
      lowAccuracyErrorCallback = jest.fn();

      watchIds.push(
        geolocation.watchPosition(
          highAccuracySuccessCallback,
          highAccuracyErrorCallback,
          { enableHighAccuracy: true },
        ),
      );
      watchIds.push(
        geolocation.watchPosition(
          lowAccuracySuccessCallback,
          lowAccuracyErrorCallback,
          { enableHighAccuracy: false },
        ),
      );

      await user.takeJourney({
        async *[Symbol.asyncIterator]() {
          yield coordsA;
          await sleep(delay);
          yield coordsB;
        },
      });
    });

    afterEach(() => {
      for (const watchId of watchIds) {
        try {
          geolocation.clearWatch(watchId);
        } catch {
          // ignored
        }
      }
    });

    it("updates the high-accuracy coordinates over time", async () => {
      await waitFor(() => {
        expectGeolocationSuccess(
          highAccuracySuccessCallback,
          highAccuracyErrorCallback,
          createPosition(coordsA, startTime, true),
        );
        expectGeolocationSuccess(
          highAccuracySuccessCallback,
          highAccuracyErrorCallback,
          createPosition(coordsB, startTime + delay, true),
        );
      });
    });

    it("updates the low-accuracy coordinates over time", async () => {
      await waitFor(() => {
        expectGeolocationSuccess(
          lowAccuracySuccessCallback,
          lowAccuracyErrorCallback,
          createPosition(
            { ...coordsA, accuracy: 111111, altitudeAccuracy: 222222 },
            startTime,
            true,
          ),
        );
        expectGeolocationSuccess(
          lowAccuracySuccessCallback,
          lowAccuracyErrorCallback,
          createPosition(
            { ...coordsB, accuracy: 111111, altitudeAccuracy: 222222 },
            startTime + delay,
            true,
          ),
        );
      });
    });
  });
});
