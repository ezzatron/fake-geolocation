import { jest } from "@jest/globals";
import { DENIED, GRANTED } from "../../src/constants/permission-state.js";
import {
  HandlePermissionRequest,
  MutableLocationServices,
  User,
  createLocationServices,
  createUser,
} from "../../src/index.js";
import {
  StdGeolocationCoordinates,
  StdPermissionState,
} from "../../src/types/std.js";

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
  let user: User;

  beforeEach(() => {
    locationServices = createLocationServices();
  });

  describe("when there is a permission request handler", () => {
    let handlePermissionRequest: jest.Mock<HandlePermissionRequest>;

    beforeEach(async () => {
      handlePermissionRequest = jest.fn();
      user = createUser({ locationServices, handlePermissionRequest });
    });

    describe("when permission has not been requested", () => {
      beforeEach(() => {
        user.resetGeolocationPermission();
      });

      describe("when permission is requested", () => {
        beforeEach(async () => {
          handlePermissionRequest.mockImplementation(
            async (): Promise<StdPermissionState> => GRANTED,
          );

          await user.requestGeolocationPermission();
        });

        it("uses the handler response", () => {
          expect(locationServices.getPermissionState()).toBe(GRANTED);
        });
      });
    });

    describe("when permission is granted", () => {
      beforeEach(() => {
        user.grantGeolocationPermission();
      });

      describe("when permission is requested", () => {
        beforeEach(async () => {
          handlePermissionRequest.mockImplementation(
            async (): Promise<StdPermissionState> => DENIED,
          );

          await user.requestGeolocationPermission();
        });

        it("leaves the permission granted", () => {
          expect(locationServices.getPermissionState()).toBe(GRANTED);
        });
      });
    });

    describe("when permission is denied", () => {
      beforeEach(() => {
        user.denyGeolocationPermission();
      });

      describe("when permission is requested", () => {
        beforeEach(async () => {
          handlePermissionRequest.mockImplementation(
            async (): Promise<StdPermissionState> => GRANTED,
          );

          await user.requestGeolocationPermission();
        });

        it("leaves the permission denied", () => {
          expect(locationServices.getPermissionState()).toBe(DENIED);
        });
      });
    });
  });

  describe("when there is no permission request handler", () => {
    beforeEach(() => {
      user = createUser({ locationServices });
    });

    describe("when permission has not been requested", () => {
      beforeEach(() => {
        user.resetGeolocationPermission();
      });

      describe("when permission is requested", () => {
        beforeEach(async () => {
          await user.requestGeolocationPermission();
        });

        it("denies the permission", () => {
          expect(locationServices.getPermissionState()).toBe(DENIED);
        });
      });
    });

    describe("when permission is granted", () => {
      beforeEach(() => {
        user.grantGeolocationPermission();
      });

      beforeEach(async () => {
        await user.requestGeolocationPermission();
      });

      it("leaves the permission granted", () => {
        expect(locationServices.getPermissionState()).toBe(GRANTED);
      });
    });

    describe("when permission is denied", () => {
      beforeEach(() => {
        user.denyGeolocationPermission();
      });

      beforeEach(async () => {
        await user.requestGeolocationPermission();
      });

      it("leaves the permission denied", () => {
        expect(locationServices.getPermissionState()).toBe(DENIED);
      });
    });
  });

  describe("when created with all default options", () => {
    beforeEach(() => {
      user = createUser({ locationServices });
    });

    describe("when permission is granted", () => {
      beforeEach(() => {
        user.grantGeolocationPermission();
      });

      describe("when jumping to coordinates", () => {
        beforeEach(() => {
          // use fake timers so that the timestamp can be tested
          jest.useFakeTimers({ advanceTimers: true, now: 111 });

          user.jumpToCoordinates(coordinatesA);
        });

        afterEach(() => {
          jest.useRealTimers();
        });

        it("updates the position coordinates", async () => {
          expect((await locationServices.getPosition()).coords).toEqual(
            coordinatesA,
          );
        });

        it("updates the position timestamp to the current time", async () => {
          expect((await locationServices.getPosition()).timestamp).toBe(111);
        });
      });
    });
  });
});
