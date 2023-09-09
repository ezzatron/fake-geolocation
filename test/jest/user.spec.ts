import { PermissionStore, createPermissionStore } from "fake-permissions";
import {
  MutableLocationServices,
  User,
  createLocationServices,
  createUser,
} from "../../src/index.js";
import { coordsA } from "../fixture/coords.js";

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
});
