import {
  IsDelegateSelected,
  MutableLocationServices,
  SelectDelegate,
  User,
  createDelegatedGeolocation,
  createGeolocation,
  createLocationServices,
  createPermissionDeniedError,
  createPosition,
  createUser,
} from "fake-geolocation";
import {
  HandlePermissionRequest,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sleep } from "../../src/async.js";
import { coordsA, coordsB, coordsC, coordsD } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
import { mockFn, type Mocked } from "../helpers.js";
import { waitFor } from "../wait-for.js";
import { expectGeolocationError, expectGeolocationSuccess } from "./expect.js";

describe("Delegated geolocation", () => {
  const startTime = 100;
  let locationServicesA: MutableLocationServices;
  let locationServicesB: MutableLocationServices;
  let permissionsA: Permissions;
  let permissionsB: Permissions;
  let userA: User;
  let userB: User;
  let delegateA: Geolocation;
  let delegateB: Geolocation;
  let geolocation: Geolocation;
  let selectDelegate: SelectDelegate;
  let isDelegateSelected: IsDelegateSelected;

  let requestPermissionA: Mocked<HandlePermissionRequest>;
  let requestPermissionB: Mocked<HandlePermissionRequest>;

  let successCallback: Mocked<PositionCallback>;
  let errorCallback: Mocked<PositionErrorCallback>;

  let watchIds: number[];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);

    locationServicesA = createLocationServices();
    locationServicesB = createLocationServices();

    const permissionStoreA = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "granted"]]),
    });
    const permissionStoreB = createPermissionStore({
      initialStates: new Map([[{ name: "geolocation" }, "granted"]]),
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

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestPermissionA = mockFn((async (d) =>
      userA.requestPermission(d)) as HandlePermissionRequest);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestPermissionB = mockFn((async (d) =>
      userB.requestPermission(d)) as HandlePermissionRequest);

    delegateA = createGeolocation({
      locationServices: locationServicesA,
      permissions: permissionsA,
      requestPermission: requestPermissionA,
    });
    delegateB = createGeolocation({
      locationServices: locationServicesB,
      permissions: permissionsB,
      requestPermission: requestPermissionB,
    });

    ({ geolocation, selectDelegate, isDelegateSelected } =
      createDelegatedGeolocation({
        delegates: [delegateA, delegateB],
        permissionsDelegates: new Map([
          [delegateA, permissionsA],
          [delegateB, permissionsB],
        ]),
      }));

    successCallback = mockFn();
    errorCallback = mockFn();

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
  });

  it("cannot be instantiated directly", async () => {
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
      expect(isDelegateSelected(delegateA)).toBe(true);
      expect(isDelegateSelected(delegateB)).toBe(false);
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

          expect(successCallback).not.toHaveBeenCalled();
        });
      });

      describe("when selecting another delegate", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          successCallback.mockClear();
          errorCallback.mockClear();
          selectDelegate(delegateB);
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

              expect(successCallback).not.toHaveBeenCalled();
            });
          });
        });
      });

      describe("when selecting another delegate where permission has not been requested", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          userB.resetPermission({ name: "geolocation" });
          successCallback.mockClear();
          errorCallback.mockClear();
          requestPermissionB.mockClear();
          selectDelegate(delegateB);
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPermissionDeniedError(""),
          );
        });

        it("does not cause a permission request", () => {
          expect(requestPermissionB).not.toHaveBeenCalled();
        });

        describe("when permission is granted", () => {
          beforeEach(() => {
            successCallback.mockClear();
            errorCallback.mockClear();
            userB.grantPermission({ name: "geolocation" });
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
            userB.denyPermission({ name: "geolocation" });
            await vi.runOnlyPendingTimersAsync();
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
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

            expect(successCallback).not.toHaveBeenCalled();
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
        userA.denyPermission({ name: "geolocation" });
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
      selectDelegate(delegateB);
    });

    it("has selected the specified delegate", () => {
      expect(isDelegateSelected(delegateB)).toBe(true);
      expect(isDelegateSelected(delegateA)).toBe(false);
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

          expect(successCallback).not.toHaveBeenCalled();
        });
      });

      describe("when selecting another delegate", () => {
        const delay = 20;

        beforeEach(async () => {
          await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
          await sleep(delay);
          successCallback.mockClear();
          errorCallback.mockClear();
          selectDelegate(delegateA);
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

              expect(successCallback).not.toHaveBeenCalled();
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

            expect(successCallback).not.toHaveBeenCalled();
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
        userB.denyPermission({ name: "geolocation" });
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
