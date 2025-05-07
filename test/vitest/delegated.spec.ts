import {
  MutableLocationServices,
  User,
  createDelegatedGeolocation,
  createGeolocation,
  createLocationServices,
  createPermissionDeniedError,
  createPosition,
  createUser,
  type DelegatedGeolocationHandle,
} from "fake-geolocation";
import {
  createPermissionStore,
  createPermissions,
  type PermissionStore,
} from "fake-permissions";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { sleep } from "../../src/async.js";
import { coordsA, coordsB, coordsC, coordsD } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { waitFor } from "../wait-for.js";
import { expectGeolocationError, expectGeolocationSuccess } from "./expect.js";

describe("Delegated geolocation", () => {
  const startTime = 100;
  let locationServicesA: MutableLocationServices;
  let locationServicesB: MutableLocationServices;
  let permissionStoreA: PermissionStore;
  let permissionStoreB: PermissionStore;
  let permissionsA: Permissions;
  let permissionsB: Permissions;
  let userA: User;
  let userB: User;
  let delegateA: Geolocation;
  let delegateB: Geolocation;
  let geolocation: Geolocation;
  let handle: DelegatedGeolocationHandle;

  let successCallback: Mock<PositionCallback>;
  let errorCallback: Mock<PositionErrorCallback>;

  let watchIds: number[];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);

    locationServicesA = createLocationServices();
    locationServicesB = createLocationServices();

    permissionStoreA = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "GRANTED"]]),
    });
    permissionStoreB = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "GRANTED"]]),
    });

    permissionsA = createPermissions({ permissionStore: permissionStoreA });
    permissionsB = createPermissions({ permissionStore: permissionStoreB });

    userA = createUser({
      locationServices: locationServicesA,
      permissionStore: permissionStoreA,
    });
    userA.jumpToCoordinates(coordsA);

    userB = createUser({
      locationServices: locationServicesB,
      permissionStore: permissionStoreB,
    });
    userB.jumpToCoordinates(coordsB);

    delegateA = createGeolocation({
      locationServices: locationServicesA,
      permissionStore: permissionStoreA,
    });
    delegateB = createGeolocation({
      locationServices: locationServicesB,
      permissionStore: permissionStoreB,
    });

    ({ geolocation, handle } = createDelegatedGeolocation({
      delegates: [delegateA, delegateB],
      permissionsDelegates: new Map([
        [delegateA, permissionsA],
        [delegateB, permissionsB],
      ]),
    }));

    successCallback = vi.fn();
    errorCallback = vi.fn();

    watchIds = [];
  });

  afterEach(() => {
    for (const watchId of watchIds) {
      try {
        geolocation.clearWatch(watchId);
      } catch {
        // ignore
      }
    }

    vi.useRealTimers();
  });

  it("has a string tag", () => {
    expect(Object.prototype.toString.call(geolocation)).toBe(
      "[object Geolocation]",
    );
  });

  it("cannot be instantiated directly", () => {
    const instantiateGeolocation = () => {
      new (geolocation.constructor as new (p: object) => unknown)({});
    };

    expect(instantiateGeolocation).toThrow(TypeError);
    expect(instantiateGeolocation).toThrow("Illegal constructor");
  });

  it("requires at least one delegate", () => {
    const call = () => {
      createDelegatedGeolocation({
        delegates: [],
        permissionsDelegates: new Map(),
      });
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("No delegates provided");
  });

  it("requires permissions delegates for all delegates", () => {
    const call = () => {
      createDelegatedGeolocation({
        delegates: [delegateA, delegateB],
        permissionsDelegates: new Map([[delegateA, permissionsA]]),
      });
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow(
      "Missing Permissions delegate for Geolocation delegate at index 1",
    );
  });

  describe("before selecting a delegate", () => {
    it("has selected the first delegate", () => {
      expect(handle.selectedDelegate()).toBe(delegateA);
      expect(handle.isSelectedDelegate(delegateA)).toBe(true);
      expect(handle.isSelectedDelegate(delegateB)).toBe(false);
    });

    describe("when reading the position", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successCallback, errorCallback);
      });

      it("calls the success callback with a position that matches the first delegate", () => {
        expectGeolocationSuccess(
          successCallback,
          errorCallback,
          createPosition(coordsA, startTime, false),
        );
      });
    });

    describe("when watching the position", () => {
      let watchId: number;

      beforeEach(() => {
        watchId = geolocation.watchPosition(successCallback, errorCallback);
        watchIds.push(watchId);
      });

      it("calls the success callback with a position that matches the first delegate", async () => {
        await waitFor(() => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsA, startTime, false),
          );
        });
      });

      describe("when the first delegate's coords change", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          userA.jumpToCoordinates(coordsC);
          await sleep(delay);
          userA.jumpToCoordinates(coordsD);
        });

        it("calls the success callback with the new position", async () => {
          await waitFor(() => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsC, startTime + delay, false),
            );
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsD, startTime + delay * 2, false),
            );
          });
        });
      });

      describe("when another delegate's coords change", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          successCallback.mockClear();
          errorCallback.mockClear();
          userB.jumpToCoordinates(coordsC);
        });

        it("does not call the success callback with the new position", async () => {
          await sleep(delay * 2);

          expect(successCallback).not.toBeCalled();
        });
      });

      describe("when selecting another delegate", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          successCallback.mockClear();
          errorCallback.mockClear();
          handle.selectDelegate(delegateB);
        });

        it("calls the success callback with a position that matches the selected delegate", async () => {
          await waitFor(() => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsB, startTime + delay, false),
            );
          });
        });

        describe("when the watch is cleared", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            geolocation.clearWatch(watchId);
          });

          describe("when the selected delegate's coords change", () => {
            beforeEach(() => {
              userB.jumpToCoordinates(coordsC);
            });

            it("does not call the success callback with the new position", async () => {
              await sleep(delay * 2);

              expect(successCallback).not.toBeCalled();
            });
          });
        });
      });

      describe("when selecting another delegate where permission has not been requested", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          userB.resetAccess({ name: "geolocation" });
          successCallback.mockClear();
          errorCallback.mockClear();
          vi.spyOn(permissionStoreB, "requestAccess");
          handle.selectDelegate(delegateB);
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPermissionDeniedError(""),
          );
        });

        it("does not cause an access request", () => {
          expect(permissionStoreB.requestAccess).not.toBeCalled();
        });

        describe("when permission is granted", () => {
          beforeEach(() => {
            successCallback.mockClear();
            errorCallback.mockClear();
            userB.grantAccess({ name: "geolocation" });
          });

          it("calls the success callback with a position that matches the selected delegate", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsB, startTime + delay, false),
              );
            });
          });
        });

        describe("when permission is denied", () => {
          beforeEach(async () => {
            successCallback.mockClear();
            errorCallback.mockClear();
            userB.blockAccess({ name: "geolocation" });
            await vi.runOnlyPendingTimersAsync();
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createPermissionDeniedError(""),
            );
          });
        });
      });

      describe("when the watch is cleared", () => {
        beforeEach(() => {
          geolocation.clearWatch(watchId);
        });

        describe("when the first delegate's coords change", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            userA.jumpToCoordinates(coordsC);
          });

          it("does not call the success callback with the new position", async () => {
            await sleep(delay * 2);

            expect(successCallback).not.toBeCalled();
          });
        });
      });
    });

    describe("when the first delegate's coords change", () => {
      beforeEach(() => {
        userA.jumpToCoordinates(coordsC);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the success callback with a position that matches the first delegate", () => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsC, startTime, false),
          );
        });
      });
    });

    describe("when another delegate's coords change", () => {
      beforeEach(() => {
        userB.jumpToCoordinates(coordsC);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("has not changed position", () => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsA, startTime, false),
          );
        });
      });
    });

    describe("when the first delegate's permission becomes denied", () => {
      beforeEach(() => {
        userA.blockAccess({ name: "geolocation" });
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPermissionDeniedError(""),
          );
        });
      });
    });
  });

  describe("after selecting a delegate", () => {
    beforeEach(() => {
      handle.selectDelegate(delegateB);
    });

    it("has selected the specified delegate", () => {
      expect(handle.selectedDelegate()).toBe(delegateB);
      expect(handle.isSelectedDelegate(delegateB)).toBe(true);
      expect(handle.isSelectedDelegate(delegateA)).toBe(false);
    });

    describe("when reading the position", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successCallback, errorCallback);
      });

      it("calls the success callback with a position that matches the selected delegate", () => {
        expectGeolocationSuccess(
          successCallback,
          errorCallback,
          createPosition(coordsB, startTime, false),
        );
      });
    });

    describe("when watching the position", () => {
      let watchId: number;

      beforeEach(() => {
        watchId = geolocation.watchPosition(successCallback, errorCallback);
        watchIds.push(watchId);
      });

      it("calls the success callback with a position that matches the selected delegate", async () => {
        await waitFor(() => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsB, startTime, false),
          );
        });
      });

      describe("when the selected delegate's coords change", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          userB.jumpToCoordinates(coordsC);
          await sleep(delay);
          userB.jumpToCoordinates(coordsD);
        });

        it("calls the success callback with the new position", async () => {
          await waitFor(() => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsC, startTime + delay, false),
            );
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsD, startTime + delay * 2, false),
            );
          });
        });
      });

      describe("when another delegate's coords change", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          successCallback.mockClear();
          errorCallback.mockClear();
          userA.jumpToCoordinates(coordsC);
        });

        it("does not call the success callback with the new position", async () => {
          await sleep(delay * 2);

          expect(successCallback).not.toBeCalled();
        });
      });

      describe("when selecting another delegate", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          successCallback.mockClear();
          errorCallback.mockClear();
          handle.selectDelegate(delegateA);
        });

        it("calls the success callback with a position that matches the selected delegate", async () => {
          await waitFor(() => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsA, startTime + delay, false),
            );
          });
        });

        describe("when the watch is cleared", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            geolocation.clearWatch(watchId);
          });

          describe("when the selected delegate's coords change", () => {
            beforeEach(() => {
              userA.jumpToCoordinates(coordsC);
            });

            it("does not call the success callback with the new position", async () => {
              await sleep(delay * 2);

              expect(successCallback).not.toBeCalled();
            });
          });
        });
      });

      describe("when the watch is cleared", () => {
        beforeEach(() => {
          geolocation.clearWatch(watchId);
        });

        describe("when the selected delegate's coords change", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            userB.jumpToCoordinates(coordsC);
          });

          it("does not call the success callback with the new position", async () => {
            await sleep(delay * 2);

            expect(successCallback).not.toBeCalled();
          });
        });
      });
    });

    describe("when the selected delegate's coords change", () => {
      beforeEach(() => {
        userB.jumpToCoordinates(coordsC);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the success callback with a position that matches the first delegate", () => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsC, startTime, false),
          );
        });
      });
    });

    describe("when another delegate's coords change", () => {
      beforeEach(() => {
        userA.jumpToCoordinates(coordsC);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("has not changed position", () => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsB, startTime, false),
          );
        });
      });
    });

    describe("when the selected delegate's permission becomes denied", () => {
      beforeEach(() => {
        userB.blockAccess({ name: "geolocation" });
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPermissionDeniedError(""),
          );
        });
      });
    });
  });

  describe("when clearing a watch that does not exist", () => {
    it("has no effect", () => {
      const call = () => {
        geolocation.clearWatch(111);
      };

      expect(call).not.toThrow();
    });
  });
});
