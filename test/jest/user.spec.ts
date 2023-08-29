import { PermissionStore, createPermissionStore } from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import { PROMPT } from "fake-permissions/constants/permission-state";
import {
  MutableLocationServices,
  User,
  createLocationServices,
  createUser,
} from "../../src/index.js";
import { StdGeolocationCoordinates } from "../../src/types/std.js";

const coordinatesA: StdGeolocationCoordinates = {
  latitude: 40.71703581534977,
  longitude: -74.03457283319447,
  accuracy: 25.019,
  altitude: 22.27227783203125,
  altitudeAccuracy: 9.838127136230469,
  heading: null,
  speed: null,
};

describe("User", () => {
  let locationServices: MutableLocationServices;
  let permissionStore: PermissionStore<typeof GEOLOCATION>;
  let user: User;

  beforeEach(() => {
    locationServices = createLocationServices();
    permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: GEOLOCATION }, PROMPT]]),
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
        user.jumpToCoordinates(coordinatesA);
      });

      it("updates the high-accuracy coordinates to match the supplied coordinates", async () => {
        expect(await locationServices.acquireCoordinates(true)).toEqual(
          coordinatesA,
        );
      });

      it("updates the low-accuracy coordinates to match the supplied coordinates", async () => {
        expect(await locationServices.acquireCoordinates(false)).toEqual(
          coordinatesA,
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
        user.jumpToCoordinates(coordinatesA);
      });

      it("updates the high-accuracy coordinates to match the supplied coordinates", async () => {
        expect(await locationServices.acquireCoordinates(true)).toEqual(
          coordinatesA,
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
});
