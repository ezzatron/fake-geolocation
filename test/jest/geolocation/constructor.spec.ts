import {
  Permissions,
  User as PermissionsUser,
  createPermissionStore,
  createPermissions,
  createUser as createPermissionsUser,
} from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import { PROMPT } from "fake-permissions/constants/permission-state";
import {
  MutableLocationServices,
  createGeolocation,
  createLocationServices,
} from "../../../src/index.js";
import { StdGeolocation } from "../../../src/types/std.js";

describe("Geolocation", () => {
  let locationServices: MutableLocationServices;
  let permissions: Permissions<typeof GEOLOCATION>;
  let permissionsUser: PermissionsUser<typeof GEOLOCATION>;
  let geolocation: StdGeolocation;

  beforeEach(() => {
    locationServices = createLocationServices();

    const permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: GEOLOCATION }, PROMPT]]),
    });
    permissions = createPermissions({ permissionStore });
    permissionsUser = createPermissionsUser({ permissionStore });

    geolocation = createGeolocation({
      locationServices,
      permissions,
      permissionsUser,
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
