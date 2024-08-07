import {
  MutableLocationServices,
  User,
  createAPIs,
  createPermissionDeniedError,
  createPosition,
  createPositionUnavailableError,
  createTimeoutError,
} from "fake-geolocation";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { sleep } from "../../../src/async.js";
import { coordsA, coordsB } from "../../fixture/coords.js";
import { getCurrentPosition } from "../../get-current-position.js";
import { expectGeolocationError, expectGeolocationSuccess } from "../expect.js";

describe("Geolocation.getCurrentPosition()", () => {
  const startTime = 100;
  let locationServices: MutableLocationServices;
  let user: User;
  let geolocation: Geolocation;

  let successCallback: Mock<PositionCallback>;
  let errorCallback: Mock<PositionErrorCallback>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);

    ({ geolocation, locationServices, user } = createAPIs({ acquireDelay: 0 }));

    successCallback = vi.fn();
    errorCallback = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when permission has not been requested", () => {
    beforeEach(() => {
      user.resetPermission({ name: "geolocation" });
    });

    describe("when coords can be acquired", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      describe("when the user dismisses the access dialog", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.dismiss();
          });
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
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

      describe("when the user dismisses the access dialog after a delay", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            await sleep(60);
            dialog.dismiss();
          });
        });

        describe("when reading the position with a timeout", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              {
                timeout: 40,
              },
            );
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

      describe("when the user permanently denies access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.deny(true);
          });
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
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

      describe("when the user temporarily denies access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.deny(false);
          });
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
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

      describe("when the user denies access after a delay", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            await sleep(60);
            dialog.deny(true);
          });
        });

        describe("when reading the position with a timeout", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              {
                timeout: 40,
              },
            );
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

      describe("when the user permanently allows access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.allow(true);
          });
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
          });

          it("calls the success callback with the position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsA, startTime, false),
            );
          });
        });
      });

      describe("when the user temporarily allows access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.allow(false);
          });
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
          });

          it("calls the success callback with the position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsA, startTime, false),
            );
          });
        });
      });

      describe("when the user allows access after a delay", () => {
        const delay = 60;

        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            await sleep(delay);
            dialog.allow(true);
          });
        });

        describe("when reading the position with a timeout", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              {
                timeout: delay - 20,
              },
            );
          });

          it("does not include the time spent waiting for permission in the timeout", () => {
            expect(successCallback).toBeCalledWith(
              createPosition(coordsA, startTime + delay, false),
            );
          });
        });
      });
    });

    describe("when coords cannot be acquired", () => {
      beforeEach(() => {
        user.disableLocationServices();
      });

      describe("when the user allows access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.allow(true);
          });
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", () => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createPositionUnavailableError(""),
            );
          });
        });
      });
    });
  });

  describe("when permission is denied", () => {
    beforeEach(() => {
      user.denyPermission({ name: "geolocation" });
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

  describe("when permission is granted", () => {
    beforeEach(() => {
      user.grantPermission({ name: "geolocation" });
    });

    describe("when acquiring coords throws an error", () => {
      beforeEach(() => {
        vi.spyOn(locationServices, "acquireCoordinates").mockRejectedValue(
          new Error("An error occurred"),
        );
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPositionUnavailableError(""),
          );
        });
      });
    });

    describe("when coords cannot be acquired", () => {
      beforeEach(() => {
        user.disableLocationServices();
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPositionUnavailableError(""),
          );
        });
      });
    });

    describe("when coords can be acquired", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      it("cannot be read synchronously", () => {
        let position: GeolocationPosition | undefined;
        geolocation.getCurrentPosition((nextPosition) => {
          position = nextPosition;
        });

        expect(position).toBeUndefined();
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the success callback with the position", () => {
          expectGeolocationSuccess(
            successCallback,
            errorCallback,
            createPosition(coordsA, startTime, false),
          );
        });
      });

      describe("when the coords change", () => {
        beforeEach(() => {
          user.jumpToCoordinates(coordsB);
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
          });

          it("calls the success callback with the new position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsB, startTime, false),
            );
          });
        });
      });
    });

    describe("when reading the position with a timeout", () => {
      describe("when the timeout is not exceeded", () => {
        describe("when coords can be acquired", () => {
          beforeEach(async () => {
            user.jumpToCoordinates(coordsA);

            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              {
                timeout: 1000,
              },
            );
          });

          it("calls the success callback with the position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsA, startTime, false),
            );
          });
        });

        describe("when coords cannot be acquired", () => {
          beforeEach(async () => {
            user.disableLocationServices();

            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              {
                timeout: 1000,
              },
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", () => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createPositionUnavailableError(""),
            );
          });
        });
      });

      describe("when the timeout is exceeded", () => {
        beforeEach(async () => {
          user.jumpToCoordinates(coordsA);

          await getCurrentPosition(
            geolocation,
            successCallback,
            errorCallback,
            {
              timeout: 0,
            },
          );
        });

        it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createTimeoutError(""),
          );
        });
      });

      describe("when the timeout is negative", () => {
        beforeEach(async () => {
          user.jumpToCoordinates(coordsA);

          await getCurrentPosition(
            geolocation,
            successCallback,
            errorCallback,
            {
              timeout: -1,
            },
          );
        });

        it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createTimeoutError(""),
          );
        });
      });
    });

    describe("when reading the position with an infinite maximum age", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      describe("when there is a cached high accuracy position", () => {
        let cachedPosition: GeolocationPosition;

        beforeEach(async () => {
          await getCurrentPosition(
            geolocation,
            (position) => {
              cachedPosition = position;
            },
            undefined,
            {
              enableHighAccuracy: true,
            },
          );

          user.jumpToCoordinates(coordsB);
        });

        it("has cached the position", () => {
          expect(cachedPosition).toMatchObject(
            createPosition(coordsA, startTime, true),
          );
        });

        describe("when reading the position with high accuracy", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: Infinity, enableHighAccuracy: true },
            );
          });

          it("calls the success callback with the cached position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              cachedPosition,
              true,
            );
          });
        });

        describe("when reading the position with low accuracy", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: Infinity, enableHighAccuracy: false },
            );
          });

          it("calls the success callback with the cached position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              cachedPosition,
              true,
            );
          });
        });

        describe("when reading the position with a timeout of 0", () => {
          describe("when reading the position with high accuracy", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { maximumAge: Infinity, timeout: 0, enableHighAccuracy: true },
              );
            });

            it("calls the success callback with the cached position", () => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });

          describe("when reading the position with low accuracy", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { maximumAge: Infinity, timeout: 0, enableHighAccuracy: false },
              );
            });

            it("calls the success callback with the cached position", () => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });
        });
      });

      describe("when there is a cached low accuracy position", () => {
        let cachedPosition: GeolocationPosition;

        beforeEach(async () => {
          await getCurrentPosition(
            geolocation,
            (position) => {
              cachedPosition = position;
            },
            undefined,
            {
              enableHighAccuracy: false,
            },
          );

          user.jumpToCoordinates(coordsB);
        });

        it("has cached the position", () => {
          expect(cachedPosition).toMatchObject(
            createPosition(coordsA, startTime, false),
          );
        });

        describe("when reading the position with high accuracy", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: Infinity, enableHighAccuracy: true },
            );
          });

          it("calls the success callback with a new position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsB, startTime + 20, true),
            );
          });
        });

        describe("when reading the position with low accuracy", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: Infinity, enableHighAccuracy: false },
            );
          });

          it("calls the success callback with the cached position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              cachedPosition,
              true,
            );
          });
        });

        describe("when reading the position with a timeout of 0", () => {
          describe("when reading the position with high accuracy", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { maximumAge: Infinity, timeout: 0, enableHighAccuracy: true },
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createTimeoutError(""),
              );
            });
          });

          describe("when reading the position with low accuracy", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { maximumAge: Infinity, timeout: 0, enableHighAccuracy: false },
              );
            });

            it("calls the success callback with the cached position", () => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });
        });
      });
    });

    describe("when reading the position with a finite maximum age", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      describe("when there is a cached position", () => {
        let cachedPosition: GeolocationPosition;

        beforeEach(async () => {
          await getCurrentPosition(geolocation, (position) => {
            cachedPosition = position;
          });

          user.jumpToCoordinates(coordsB);
          vi.setSystemTime(startTime + 20);
        });

        it("has cached the position", () => {
          expect(cachedPosition).toMatchObject(
            createPosition(coordsA, startTime, false),
          );
        });

        describe("when reading the position with a maximum age older than the age of the cached position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: 21 },
            );
          });

          it("calls the success callback with the cached position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              cachedPosition,
              true,
            );
          });
        });

        describe("when reading the position with a maximum age equal to the age of the cached position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: 20 },
            );
          });

          it("calls the success callback with the cached position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              cachedPosition,
              true,
            );
          });
        });

        describe("when reading the position with a maximum age newer than the age of the cached position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: 19 },
            );
          });

          it("calls the success callback with a new position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsB, startTime + 20, false),
            );
          });
        });

        describe("when reading the position with a timeout of 0", () => {
          describe("when reading the position with a maximum age older than the age of the cached position", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { timeout: 0, maximumAge: 21 },
              );
            });

            it("calls the success callback with the cached position", () => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });

          describe("when reading the position with a maximum age equal to the age of the cached position", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { timeout: 0, maximumAge: 20 },
              );
            });

            it("calls the success callback with the cached position", () => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });

          describe("when reading the position with a maximum age newer than the age of the cached position", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { timeout: 0, maximumAge: 19 },
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createTimeoutError(""),
              );
            });
          });
        });
      });
    });

    describe("when reading the position with a maximum age of 0", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      describe("when there is a cached position", () => {
        let cachedPosition: GeolocationPosition;

        beforeEach(async () => {
          await getCurrentPosition(geolocation, (position) => {
            cachedPosition = position;
          });

          user.jumpToCoordinates(coordsB);
        });

        it("has cached the position", () => {
          expect(cachedPosition).toMatchObject(
            createPosition(coordsA, startTime, false),
          );
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
              { maximumAge: 0 },
            );
          });

          it("calls the success callback with a new position", () => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsB, startTime + 20, false),
            );
          });
        });

        describe("when reading the position with a timeout of 0", () => {
          describe("when reading the position", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                { maximumAge: 0, timeout: 0 },
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", () => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createTimeoutError(""),
              );
            });
          });
        });
      });
    });
  });

  describe("when reading the position will result in an error", () => {
    beforeEach(() => {
      user.setAccessRequestHandler(async (dialog) => {
        dialog.deny(true);
      });
    });

    describe("when reading the position with an error callback", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successCallback, errorCallback);
      });

      it("calls the error callback with a GeolocationPositionError", () => {
        expectGeolocationError(
          successCallback,
          errorCallback,
          createPermissionDeniedError(""),
        );
      });
    });

    describe("when reading the position without an error callback", () => {
      beforeEach(async () => {
        await getCurrentPosition(
          geolocation,
          successCallback,
          undefined,
          undefined,
          AbortSignal.timeout(10),
        );
      });

      it("does not call the success callback", () => {
        expect(successCallback).not.toBeCalled();
      });
    });
  });
});
