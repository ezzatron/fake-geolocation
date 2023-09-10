import { jest } from "@jest/globals";
import { createPermissionStore, createPermissions } from "fake-permissions";
import { sleep } from "../../src/async.js";
import {
  MutableLocationServices,
  SelectDelegate,
  User,
  createDelegatedGeolocation,
  createGeolocation,
  createLocationServices,
  createPermissionDeniedError,
  createPosition,
  createUser,
} from "../../src/index.js";
import { coordsA, coordsB, coordsC, coordsD } from "../fixture/coords.js";
import { getCurrentPosition } from "../get-current-position.js";
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

  let successCallback: jest.Mock;
  let errorCallback: jest.Mock;

  let watchIds: number[];

  beforeEach(() => {
    jest.setSystemTime(startTime);

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

    delegateA = createGeolocation({
      locationServices: locationServicesA,
      permissions: permissionsA,

      async requestPermission(descriptor) {
        return userA.requestPermission(descriptor);
      },
    });
    delegateB = createGeolocation({
      locationServices: locationServicesB,
      permissions: permissionsB,

      async requestPermission(descriptor) {
        return userB.requestPermission(descriptor);
      },
    });

    ({ geolocation, selectDelegate } = createDelegatedGeolocation({
      delegates: [delegateA, delegateB],
    }));

    successCallback = jest.fn();
    errorCallback = jest.fn();

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
      createDelegatedGeolocation({ delegates: [] });
    };

    expect(call).toThrow(TypeError);
    expect(call).toThrow("No delegates provided");
  });

  describe("before selecting a delegate", () => {
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
          await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
          await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
          await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
            await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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

      describe("when the watch is cleared", () => {
        beforeEach(() => {
          geolocation.clearWatch(watchId);
        });

        describe("when the first delegate's coords change", () => {
          const delay = 20;

          beforeEach(async () => {
            await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
          await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
          await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
          await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
            await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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
            await jest.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
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