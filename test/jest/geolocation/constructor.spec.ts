import {
  Permissions,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import { PROMPT } from "fake-permissions/constants/permission-state";
import {
  MutableLocationServices,
  User,
  createGeolocation,
  createLocationServices,
  createUser,
} from "../../../src/index.js";
import { StdGeolocation } from "../../../src/types/std.js";

describe("Geolocation", () => {
  let locationServices: MutableLocationServices;
  let permissions: Permissions<typeof GEOLOCATION>;
  let user: User<typeof GEOLOCATION>;
  let geolocation: StdGeolocation;

  beforeEach(() => {
    locationServices = createLocationServices();

    const permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: GEOLOCATION }, PROMPT]]),
    });
    permissions = createPermissions({ permissionStore });

    user = createUser({ locationServices, permissionStore });

    geolocation = createGeolocation({
      async requestPermission(descriptor) {
        return user.requestPermission(descriptor);
      },

      locationServices,
      permissions,
    });
  });

  it("cannot be instantiated directly", () => {
    const call = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("Illegal constructor");
  });
});
