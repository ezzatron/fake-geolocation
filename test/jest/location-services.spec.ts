import {
  PermissionStore,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import { DENIED, GRANTED } from "../../src/constants/permission-state.js";
import {
  MutableLocationServices,
  createLocationServices,
} from "../../src/index.js";

describe("Location services", () => {
  let locationServices: MutableLocationServices;

  beforeEach(() => {
    locationServices = createLocationServices();
  });

  describe("when watching a Permissions API", () => {
    let permissionStore: PermissionStore<typeof GEOLOCATION>;
    let permissions: Permissions;
    let stopWatching: () => void;

    beforeEach(async () => {
      permissionStore = createPermissionStore<typeof GEOLOCATION>({
        initialStates: new Map([[{ name: GEOLOCATION }, GRANTED]]),
      });
      permissions = createPermissions({ permissionStore });

      stopWatching = locationServices.watchPermission(
        await permissions.query({ name: GEOLOCATION }),
      );
    });

    it("should initialize the permission state by querying the geolocation permission from the API", () => {
      expect(locationServices.getPermissionState()).toBe(GRANTED);
    });

    describe("when the permissions API changes the geolocation permission", () => {
      beforeEach(() => {
        permissionStore.set({ name: GEOLOCATION }, DENIED);
      });

      it("should update the permission state", () => {
        expect(locationServices.getPermissionState()).toBe(DENIED);
      });
    });

    describe("when no longer watching", () => {
      beforeEach(() => {
        stopWatching();
      });

      describe("when the permissions API changes the geolocation permission", () => {
        beforeEach(() => {
          permissionStore.set({ name: GEOLOCATION }, DENIED);
        });

        it("should not update the permission state", () => {
          expect(locationServices.getPermissionState()).toBe(GRANTED);
        });
      });
    });
  });
});
