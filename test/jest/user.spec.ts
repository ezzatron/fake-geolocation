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
  let user: User;

  beforeEach(() => {
    locationServices = createLocationServices();
    user = createUser({ locationServices });
  });

  describe("when jumping to coords", () => {
    beforeEach(() => {
      user.jumpToCoordinates(coordinatesA);
    });

    it("updates the coords", async () => {
      expect(await locationServices.acquireCoordinates(true)).toEqual(
        coordinatesA,
      );
    });
  });
});
