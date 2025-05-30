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
import { coordsA, coordsB, coordsC } from "../../fixture/coords.js";
import { getCurrentPosition } from "../../get-current-position.js";
import { waitFor } from "../../wait-for.js";
import { expectGeolocationError, expectGeolocationSuccess } from "../expect.js";

describe("Geolocation.watchPosition()", () => {
  const startTime = 100;
  let locationServices: MutableLocationServices;
  let user: User;
  let geolocation: Geolocation;

  let successCallback: Mock<PositionCallback>;
  let errorCallback: Mock<PositionErrorCallback>;

  let watchIds: number[];

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(startTime);

    ({ geolocation, locationServices, user } = createAPIs({
      locationServicesParams: { acquireDelay: 0 },
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

  describe("when permission has not been requested", () => {
    beforeEach(() => {
      user.resetAccess({ name: "geolocation" });
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

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPermissionDeniedError(""),
              );
            });
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

        describe("when watching the position with a timeout", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                timeout: 40,
              }),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPermissionDeniedError(""),
              );
            });
          });
        });
      });

      describe("when the user permanently denies access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.remember(true);
            dialog.deny();
          });
        });

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPermissionDeniedError(""),
              );
            });
          });
        });
      });

      describe("when the user temporarily denies access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.deny();
          });
        });

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPermissionDeniedError(""),
              );
            });
          });
        });
      });

      describe("when the user denies access after a delay", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            await sleep(60);
            dialog.remember(true);
            dialog.deny();
          });
        });

        describe("when watching the position with a timeout", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                timeout: 40,
              }),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPermissionDeniedError(""),
              );
            });
          });
        });
      });

      describe("when the user permanently allows access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.remember(true);
            dialog.allow();
          });
        });

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the success callback with the position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsA, startTime, false),
              );
            });
          });
        });
      });

      describe("when the user temporarily allows access", () => {
        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            dialog.allow();
          });
        });

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the success callback with the position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsA, startTime, false),
              );
            });
          });

          describe("when the coords change", () => {
            const delay = 20;

            beforeEach(async () => {
              await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
              await sleep(delay);
              user.jumpToCoordinates(coordsB);
            });

            it("calls the success callback with the new position", async () => {
              await waitFor(() => {
                expectGeolocationSuccess(
                  successCallback,
                  errorCallback,
                  createPosition(coordsB, startTime + delay, false),
                );
              });
            });
          });
        });
      });

      describe("when the user allows access after a delay", () => {
        const delay = 60;

        beforeEach(() => {
          user.setAccessRequestHandler(async (dialog) => {
            await sleep(delay);
            dialog.remember(true);
            dialog.allow();
          });
        });

        describe("when watching the position with a timeout", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                timeout: delay - 20,
              }),
            );
          });

          it("does not include the time spent waiting for permission in the timeout", async () => {
            await waitFor(() => {
              expect(successCallback).toBeCalledWith(
                createPosition(coordsA, startTime + delay, false),
              );
            });
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
            dialog.remember(true);
            dialog.allow();
          });
        });

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
            await waitFor(() => {
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
  });

  describe("when permission is denied", () => {
    beforeEach(() => {
      user.blockAccess({ name: "geolocation" });
    });

    describe("when watching the position", () => {
      beforeEach(() => {
        watchIds.push(
          geolocation.watchPosition(successCallback, errorCallback),
        );
      });

      it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
        await waitFor(() => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPermissionDeniedError(""),
          );
        });
      });
    });
  });

  describe("when permission is granted", () => {
    beforeEach(() => {
      user.grantAccess({ name: "geolocation" });
    });

    describe("when acquiring coords throws an error", () => {
      beforeEach(() => {
        vi.spyOn(locationServices, "acquireCoordinates").mockRejectedValue(
          new Error("An error occurred"),
        );
      });

      describe("when watching the position", () => {
        beforeEach(() => {
          watchIds.push(
            geolocation.watchPosition(successCallback, errorCallback),
          );
        });

        it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
          await waitFor(() => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createPositionUnavailableError(""),
            );
          });
        });
      });
    });

    describe("when coords cannot be acquired", () => {
      beforeEach(() => {
        user.disableLocationServices();
      });

      describe("when watching the position", () => {
        beforeEach(() => {
          watchIds.push(
            geolocation.watchPosition(successCallback, errorCallback),
          );
        });

        it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
          await waitFor(() => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createPositionUnavailableError(""),
            );
          });
        });
      });
    });

    describe("when coords can be acquired", () => {
      beforeEach(() => {
        user.jumpToCoordinates(coordsA);
      });

      describe("when watching the position", () => {
        let watchId: number;

        beforeEach(() => {
          watchId = geolocation.watchPosition(successCallback, errorCallback);
          watchIds.push(watchId);
        });

        it("calls the success callback with the position", async () => {
          await waitFor(() => {
            expectGeolocationSuccess(
              successCallback,
              errorCallback,
              createPosition(coordsA, startTime, false),
            );
          });
        });

        describe("when the coords change", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            user.jumpToCoordinates(coordsB);
            await sleep(delay);
            user.jumpToCoordinates(coordsC);
          });

          it("calls the success callback with the new position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsB, startTime + delay, false),
              );
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsC, startTime + delay * 2, false),
              );
            });
          });
        });

        describe("when the watch is cleared", () => {
          beforeEach(() => {
            geolocation.clearWatch(watchId);
          });

          describe("when the coords change", () => {
            const delay = 20;

            beforeEach(async () => {
              await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
              await sleep(delay);
              successCallback.mockClear();
              errorCallback.mockClear();
              user.jumpToCoordinates(coordsB);
            });

            it("does not call the success callback with the new position", async () => {
              await sleep(delay * 2);

              expect(successCallback).not.toBeCalled();
            });
          });
        });

        describe("when permission is revoked", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            user.blockAccess({ name: "geolocation" });
          });

          it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPermissionDeniedError(""),
              );
            });
          });

          describe("when the coords change", () => {
            const delay = 20;

            beforeEach(async () => {
              await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
              await sleep(delay);
              successCallback.mockClear();
              errorCallback.mockClear();
              user.jumpToCoordinates(coordsB);
            });

            it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", async () => {
              await waitFor(() => {
                expectGeolocationError(
                  successCallback,
                  errorCallback,
                  createPermissionDeniedError(""),
                );
              });
            });

            describe("when permission is re-granted", () => {
              beforeEach(() => {
                successCallback.mockClear();
                errorCallback.mockClear();
                user.grantAccess({ name: "geolocation" });
              });

              it("calls the success callback with the position", async () => {
                await waitFor(() => {
                  expectGeolocationSuccess(
                    successCallback,
                    errorCallback,
                    createPosition(coordsB, startTime + delay * 2, false),
                  );
                });
              });

              describe("when the coords change", () => {
                beforeEach(async () => {
                  await vi.runOnlyPendingTimersAsync(); // ensure that the previous position is acquired
                  await sleep(delay);
                  successCallback.mockClear();
                  errorCallback.mockClear();
                  user.jumpToCoordinates(coordsC);
                });

                it("calls the success callback with the new position", async () => {
                  await waitFor(() => {
                    expectGeolocationSuccess(
                      successCallback,
                      errorCallback,
                      createPosition(coordsC, startTime + delay * 3, false),
                    );
                  });
                });
              });
            });
          });

          describe("when the permission changes, but access is still not allowed", () => {
            beforeEach(() => {
              successCallback.mockClear();
              errorCallback.mockClear();
              user.setAccessRequestHandler(async (dialog) => {
                dialog.deny();
              });
              user.resetAccess({ name: "geolocation" });
            });

            it("does not call the error callback", async () => {
              await sleep(20);

              expect(errorCallback).not.toBeCalled();
            });
          });
        });

        describe("when a permission other than geolocation is revoked", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            user.blockAccess({ name: "notifications" });
          });

          it("does not call the error callback", async () => {
            await sleep(delay * 2);

            expect(errorCallback).not.toBeCalled();
          });
        });

        describe("when location services is disabled", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            user.disableLocationServices();
          });

          it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPositionUnavailableError(""),
              );
            });
          });

          describe("when location services is re-enabled", () => {
            beforeEach(async () => {
              await vi.runOnlyPendingTimersAsync();
              successCallback.mockClear();
              errorCallback.mockClear();
              user.enableLocationServices();
            });

            it("calls the success callback with the position", async () => {
              await waitFor(() => {
                expectGeolocationSuccess(
                  successCallback,
                  errorCallback,
                  createPosition(coordsA, startTime + delay, false),
                );
              });
            });

            describe("when the coords change", () => {
              beforeEach(async () => {
                await vi.runOnlyPendingTimersAsync(); // ensure that the previous position is acquired
                await sleep(delay);
                successCallback.mockClear();
                errorCallback.mockClear();
                user.jumpToCoordinates(coordsC);
              });

              it("calls the success callback with the new position", async () => {
                await waitFor(() => {
                  expectGeolocationSuccess(
                    successCallback,
                    errorCallback,
                    createPosition(coordsC, startTime + delay * 2, false),
                  );
                });
              });
            });
          });
        });
      });
    });

    describe("when watching the position with a timeout", () => {
      describe("when the timeout is not exceeded", () => {
        describe("when coords can be acquired", () => {
          beforeEach(() => {
            user.jumpToCoordinates(coordsA);

            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                timeout: 1000,
              }),
            );
          });

          it("calls the success callback with the position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsA, startTime, false),
              );
            });
          });
        });

        describe("when coords cannot be acquired", () => {
          beforeEach(() => {
            user.disableLocationServices();

            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback),
            );
          });

          it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createPositionUnavailableError(""),
              );
            });
          });
        });
      });

      describe("when the timeout is exceeded", () => {
        beforeEach(() => {
          user.jumpToCoordinates(coordsA);

          watchIds.push(
            geolocation.watchPosition(successCallback, errorCallback, {
              timeout: 0,
            }),
          );
        });

        it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", async () => {
          await waitFor(() => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createTimeoutError(""),
            );
          });
        });

        describe("when the coords change", () => {
          const delay = 20;

          beforeEach(async () => {
            await vi.runOnlyPendingTimersAsync(); // ensure that the first position is acquired
            await sleep(delay);
            successCallback.mockClear();
            errorCallback.mockClear();
            user.jumpToCoordinates(coordsB);
          });

          it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", async () => {
            await waitFor(() => {
              expectGeolocationError(
                successCallback,
                errorCallback,
                createTimeoutError(""),
              );
            });
          });
        });
      });

      describe("when the timeout is negative", () => {
        beforeEach(() => {
          user.jumpToCoordinates(coordsA);

          watchIds.push(
            geolocation.watchPosition(successCallback, errorCallback, {
              timeout: -1,
            }),
          );
        });

        it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", async () => {
          await waitFor(() => {
            expectGeolocationError(
              successCallback,
              errorCallback,
              createTimeoutError(""),
            );
          });
        });
      });
    });

    describe("when watching the position with an infinite maximum age", () => {
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

        describe("when watching the position with high accuracy", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: Infinity,
                enableHighAccuracy: true,
              }),
            );
          });

          it("calls the success callback with the cached position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });

          describe("when the coords change", () => {
            beforeEach(async () => {
              await sleep(20);
              user.jumpToCoordinates(coordsB);
            });

            it("calls the success callback with the new position", async () => {
              await waitFor(() => {
                expectGeolocationSuccess(
                  successCallback,
                  errorCallback,
                  createPosition(coordsB, startTime + 40, true),
                );
              });
            });
          });
        });

        describe("when watching the position with low accuracy", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: Infinity,
                enableHighAccuracy: false,
              }),
            );
          });

          it("calls the success callback with the cached position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });
        });

        describe("when watching the position with a timeout of 0", () => {
          describe("when watching the position with high accuracy", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  maximumAge: Infinity,
                  timeout: 0,
                  enableHighAccuracy: true,
                }),
              );
            });

            it("calls the success callback with the cached position", async () => {
              await waitFor(() => {
                expectGeolocationSuccess(
                  successCallback,
                  errorCallback,
                  cachedPosition,
                  true,
                );
              });
            });
          });

          describe("when watching the position with low accuracy", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  maximumAge: Infinity,
                  timeout: 0,
                  enableHighAccuracy: false,
                }),
              );
            });

            it("calls the success callback with the cached position", async () => {
              await waitFor(() => {
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

        describe("when watching the position with high accuracy", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: Infinity,
                enableHighAccuracy: true,
              }),
            );
          });

          it("calls the success callback with a new position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsB, startTime + 20, true),
              );
            });
          });
        });

        describe("when watching the position with low accuracy", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: Infinity,
                enableHighAccuracy: false,
              }),
            );
          });

          it("calls the success callback with the cached position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });
        });

        describe("when watching the position with a timeout of 0", () => {
          describe("when watching the position with high accuracy", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  maximumAge: Infinity,
                  timeout: 0,
                  enableHighAccuracy: true,
                }),
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", async () => {
              await waitFor(() => {
                expectGeolocationError(
                  successCallback,
                  errorCallback,
                  createTimeoutError(""),
                );
              });
            });
          });

          describe("when watching the position with low accuracy", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  maximumAge: Infinity,
                  timeout: 0,
                  enableHighAccuracy: false,
                }),
              );
            });

            it("calls the success callback with the cached position", async () => {
              await waitFor(() => {
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
    });

    describe("when watching the position with a finite maximum age", () => {
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

        describe("when watching the position with a maximum age older than the age of the cached position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: 21,
              }),
            );
          });

          it("calls the success callback with the cached position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });
        });

        describe("when watching the position with a maximum age equal to the age of the cached position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: 20,
              }),
            );
          });

          it("calls the success callback with the cached position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                cachedPosition,
                true,
              );
            });
          });
        });

        describe("when watching the position with a maximum age newer than the age of the cached position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: 19,
              }),
            );
          });

          it("calls the success callback with a new position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsB, startTime + 20, false),
              );
            });
          });
        });

        describe("when watching the position with a timeout of 0", () => {
          describe("when watching the position with a maximum age older than the age of the cached position", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  timeout: 0,
                  maximumAge: 21,
                }),
              );
            });

            it("calls the success callback with the cached position", async () => {
              await waitFor(() => {
                expectGeolocationSuccess(
                  successCallback,
                  errorCallback,
                  cachedPosition,
                  true,
                );
              });
            });
          });

          describe("when watching the position with a maximum age equal to the age of the cached position", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  timeout: 0,
                  maximumAge: 20,
                }),
              );
            });

            it("calls the success callback with the cached position", async () => {
              await waitFor(() => {
                expectGeolocationSuccess(
                  successCallback,
                  errorCallback,
                  cachedPosition,
                  true,
                );
              });
            });
          });

          describe("when watching the position with a maximum age newer than the age of the cached position", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  timeout: 0,
                  maximumAge: 19,
                }),
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", async () => {
              await waitFor(() => {
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

    describe("when watching the position with a maximum age of 0", () => {
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

        describe("when watching the position", () => {
          beforeEach(() => {
            watchIds.push(
              geolocation.watchPosition(successCallback, errorCallback, {
                maximumAge: 0,
              }),
            );
          });

          it("calls the success callback with a new position", async () => {
            await waitFor(() => {
              expectGeolocationSuccess(
                successCallback,
                errorCallback,
                createPosition(coordsB, startTime + 20, false),
              );
            });
          });
        });

        describe("when watching the position with a timeout of 0", () => {
          describe("when watching the position", () => {
            beforeEach(() => {
              watchIds.push(
                geolocation.watchPosition(successCallback, errorCallback, {
                  maximumAge: 0,
                  timeout: 0,
                }),
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of TIMEOUT and an empty message", async () => {
              await waitFor(() => {
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
  });

  describe("when watching the position will result in an error", () => {
    beforeEach(() => {
      user.setAccessRequestHandler(async (dialog) => {
        dialog.remember(true);
        dialog.deny();
      });
    });

    describe("when watching the position with an error callback", () => {
      beforeEach(() => {
        watchIds.push(
          geolocation.watchPosition(successCallback, errorCallback),
        );
      });

      it("calls the error callback with a GeolocationPositionError", async () => {
        await waitFor(() => {
          expectGeolocationError(
            successCallback,
            errorCallback,
            createPermissionDeniedError(""),
          );
        });
      });
    });

    describe("when watching the position without an error callback", () => {
      beforeEach(() => {
        watchIds.push(geolocation.watchPosition(successCallback));
      });

      it("does not call the success callback", async () => {
        await sleep(10);

        expect(successCallback).not.toBeCalled();
      });
    });
  });
});
