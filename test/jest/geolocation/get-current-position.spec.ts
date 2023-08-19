import { jest } from "@jest/globals";
import { sleep } from "../../../src/async.js";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "../../../src/constants/permission-state.js";
import {
  GeolocationPositionError,
  HandlePermissionRequest,
  MutableLocationServices,
  createGeolocation,
  createLocationServices,
} from "../../../src/index.js";
import {
  StdGeolocation,
  StdGeolocationCoordinates,
  StdGeolocationPosition,
  StdPermissionState,
  StdPositionCallback,
  StdPositionErrorCallback,
  StdPositionOptions,
} from "../../../src/types/std.js";

const coordsA: StdGeolocationCoordinates = {
  latitude: 40.71703581534977,
  longitude: -74.03457283319447,
  accuracy: 25.019,
  altitude: 22.27227783203125,
  altitudeAccuracy: 9.838127136230469,
  heading: null,
  speed: null,
};
const coordsB: StdGeolocationCoordinates = {
  latitude: 12,
  longitude: 34,
  accuracy: 56,
  altitude: 78,
  altitudeAccuracy: 9,
  heading: null,
  speed: null,
};

describe("Geolocation.getCurrentPosition()", () => {
  let locationServices: MutableLocationServices;
  let geolocation: StdGeolocation;

  let successCallback: jest.Mock;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    successCallback = jest.fn();
    errorCallback = jest.fn();
  });

  describe("when there is a permission request handler", () => {
    let handlePermissionRequestA: jest.Mock<HandlePermissionRequest>;

    beforeEach(() => {
      locationServices = createLocationServices();
      geolocation = createGeolocation({ locationServices });

      handlePermissionRequestA = jest.fn();
      locationServices.addPermissionRequestHandler(handlePermissionRequestA);
    });

    describe("when permission has not been requested", () => {
      beforeEach(() => {
        locationServices.setPermissionState(PROMPT);
      });

      describe("when coords can be acquired", () => {
        beforeEach(() => {
          locationServices.setCoordinates(coordsA);
        });

        describe("when the handler resets the permission immediately", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => PROMPT,
            );
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
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.PERMISSION_DENIED,
              );
              expect(error.message).toBe("");
            });

            it("does not call the success callback", () => {
              expect(successCallback).not.toHaveBeenCalled();
            });
          });

          describe("when the same handler is added again", () => {
            beforeEach(() => {
              locationServices.addPermissionRequestHandler(
                handlePermissionRequestA,
              );
            });

            describe("when reading the position", () => {
              beforeEach(async () => {
                await getCurrentPosition(
                  geolocation,
                  successCallback,
                  errorCallback,
                );
              });

              it("calls the handler twice", () => {
                expect(handlePermissionRequestA).toHaveBeenCalledTimes(2);
              });
            });

            describe("when the handler is removed", () => {
              beforeEach(() => {
                locationServices.removePermissionRequestHandler(
                  handlePermissionRequestA,
                );
              });

              describe("when reading the position", () => {
                beforeEach(async () => {
                  await getCurrentPosition(
                    geolocation,
                    successCallback,
                    errorCallback,
                  );
                });

                it("calls the handler once", () => {
                  expect(handlePermissionRequestA).toHaveBeenCalledTimes(1);
                });
              });
            });
          });
        });

        describe("when the handler resets the permission after a delay", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => {
                await sleep(20);

                return PROMPT;
              },
            );
          });

          describe("when reading the position with a timeout", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                {
                  timeout: 10,
                },
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.PERMISSION_DENIED,
              );
              expect(error.message).toBe("");
            });
          });
        });

        describe("when the handler denies the permission immediately", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => DENIED,
            );
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
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.PERMISSION_DENIED,
              );
              expect(error.message).toBe("");
            });

            it("does not call the success callback", () => {
              expect(successCallback).not.toHaveBeenCalled();
            });
          });
        });

        describe("when the handler denies the permission after a delay", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => {
                await sleep(20);

                return DENIED;
              },
            );
          });

          describe("when reading the position with a timeout", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                {
                  timeout: 10,
                },
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.PERMISSION_DENIED,
              );
              expect(error.message).toBe("");
            });
          });
        });

        describe("when the handler grants the permission immediately", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => GRANTED,
            );
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
              expect(successCallback).toHaveBeenCalledWith({
                coords: coordsA,
                timestamp: expect.any(Number) as number,
              });
            });

            it("does not call the error callback", () => {
              expect(errorCallback).not.toHaveBeenCalled();
            });
          });
        });

        describe("when the handler grants the permission after a delay", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => {
                await sleep(20);

                return GRANTED;
              },
            );
          });

          describe("when reading the position with a timeout", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                {
                  timeout: 10,
                },
              );
            });

            it("does not include the time spent waiting for permission in the timeout", () => {
              expect(successCallback).toHaveBeenCalledWith({
                coords: coordsA,
                timestamp: expect.any(Number) as number,
              });
            });
          });
        });

        describe("when the handler is removed", () => {
          beforeEach(() => {
            locationServices.removePermissionRequestHandler(
              handlePermissionRequestA,
            );
          });

          describe("when reading the position", () => {
            beforeEach(async () => {
              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
              );
            });

            it("does not call the permission request handler", () => {
              expect(handlePermissionRequestA).not.toHaveBeenCalled();
            });

            it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.PERMISSION_DENIED,
              );
              expect(error.message).toBe("");
            });

            it("does not call the success callback", () => {
              expect(successCallback).not.toHaveBeenCalled();
            });
          });
        });

        describe("when another handler is added", () => {
          let handlePermissionRequestB: jest.Mock<HandlePermissionRequest>;

          beforeEach(() => {
            handlePermissionRequestB = jest.fn();
            locationServices.addPermissionRequestHandler(
              handlePermissionRequestB,
            );
          });

          describe("when the newly-added handler does not change the state", () => {
            beforeEach(() => {
              handlePermissionRequestA.mockImplementation(
                async (): Promise<StdPermissionState> => GRANTED,
              );
              handlePermissionRequestB.mockImplementation(
                async (): Promise<StdPermissionState> => PROMPT,
              );
            });

            describe("when reading the position", () => {
              beforeEach(async () => {
                await getCurrentPosition(
                  geolocation,
                  successCallback,
                  errorCallback,
                );
              });

              it("uses the response from the original handler", () => {
                expect(successCallback).toHaveBeenCalledWith({
                  coords: coordsA,
                  timestamp: expect.any(Number) as number,
                });
              });
            });
          });

          describe("when the newly-added handler changes the state", () => {
            beforeEach(() => {
              handlePermissionRequestA.mockImplementation(
                async (): Promise<StdPermissionState> => DENIED,
              );
              handlePermissionRequestB.mockImplementation(
                async (): Promise<StdPermissionState> => GRANTED,
              );
            });

            describe("when reading the position", () => {
              beforeEach(async () => {
                await getCurrentPosition(
                  geolocation,
                  successCallback,
                  errorCallback,
                );
              });

              it("uses the response from the newly-added handler", () => {
                expect(successCallback).toHaveBeenCalledWith({
                  coords: coordsA,
                  timestamp: expect.any(Number) as number,
                });
              });
            });
          });

          describe("when the newly-added handler is removed", () => {
            beforeEach(() => {
              handlePermissionRequestA.mockImplementation(
                async (): Promise<StdPermissionState> => GRANTED,
              );
              handlePermissionRequestB.mockImplementation(
                async (): Promise<StdPermissionState> => DENIED,
              );

              locationServices.removePermissionRequestHandler(
                handlePermissionRequestB,
              );
            });

            describe("when reading the position", () => {
              beforeEach(async () => {
                await getCurrentPosition(
                  geolocation,
                  successCallback,
                  errorCallback,
                );
              });

              it("uses the response from the original handler", () => {
                expect(successCallback).toHaveBeenCalledWith({
                  coords: coordsA,
                  timestamp: expect.any(Number) as number,
                });
              });
            });
          });

          describe("when the original handler is removed", () => {
            beforeEach(() => {
              handlePermissionRequestA.mockImplementation(
                async (): Promise<StdPermissionState> => DENIED,
              );
              handlePermissionRequestB.mockImplementation(
                async (): Promise<StdPermissionState> => GRANTED,
              );

              locationServices.removePermissionRequestHandler(
                handlePermissionRequestA,
              );
            });

            describe("when reading the position", () => {
              beforeEach(async () => {
                await getCurrentPosition(
                  geolocation,
                  successCallback,
                  errorCallback,
                );
              });

              it("uses the response from the newly-added handler", () => {
                expect(successCallback).toHaveBeenCalledWith({
                  coords: coordsA,
                  timestamp: expect.any(Number) as number,
                });
              });
            });
          });
        });
      });

      describe("when coords cannot be acquired", () => {
        beforeEach(() => {
          locationServices.setCoordinates(undefined);
        });

        describe("when the handler grants the permission", () => {
          beforeEach(() => {
            handlePermissionRequestA.mockImplementation(
              async (): Promise<StdPermissionState> => GRANTED,
            );
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
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.POSITION_UNAVAILABLE,
              );
              expect(error.message).toBe("");
            });

            it("does not call the success callback", () => {
              expect(successCallback).not.toHaveBeenCalled();
            });
          });
        });
      });
    });

    describe("when permission is denied", () => {
      beforeEach(() => {
        locationServices.setPermissionState(DENIED);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("does not call the permission request handler", () => {
          expect(handlePermissionRequestA).not.toHaveBeenCalled();
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
          expect(errorCallback).toHaveBeenCalled();
          expect(errorCallback.mock.calls[0][0]).toBeDefined();

          const error = errorCallback.mock
            .calls[0][0] as GeolocationPositionError;

          expect(error).toBeInstanceOf(GeolocationPositionError);
          expect(error.code).toBe(GeolocationPositionError.PERMISSION_DENIED);
          expect(error.message).toBe("");
        });

        it("does not call the success callback", () => {
          expect(successCallback).not.toHaveBeenCalled();
        });
      });
    });

    describe("when permission is granted", () => {
      beforeEach(() => {
        locationServices.setPermissionState(GRANTED);
      });

      describe("when acquiring coords throws an error", () => {
        beforeEach(() => {
          jest
            .spyOn(locationServices, "acquireCoordinates")
            .mockRejectedValue(new Error("An error occurred"));
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
            expect(errorCallback).toHaveBeenCalled();
            expect(errorCallback.mock.calls[0][0]).toBeDefined();

            const error = errorCallback.mock
              .calls[0][0] as GeolocationPositionError;

            expect(error).toBeInstanceOf(GeolocationPositionError);
            expect(error.code).toBe(
              GeolocationPositionError.POSITION_UNAVAILABLE,
            );
            expect(error.message).toBe("");
          });
        });
      });

      describe("when coords cannot be acquired", () => {
        beforeEach(() => {
          locationServices.setCoordinates(undefined);
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
          });

          it("does not call the permission request handler", () => {
            expect(handlePermissionRequestA).not.toHaveBeenCalled();
          });

          it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", () => {
            expect(errorCallback).toHaveBeenCalled();
            expect(errorCallback.mock.calls[0][0]).toBeDefined();

            const error = errorCallback.mock
              .calls[0][0] as GeolocationPositionError;

            expect(error).toBeInstanceOf(GeolocationPositionError);
            expect(error.code).toBe(
              GeolocationPositionError.POSITION_UNAVAILABLE,
            );
            expect(error.message).toBe("");
          });

          it("does not call the success callback", () => {
            expect(successCallback).not.toHaveBeenCalled();
          });
        });
      });

      describe("when coords can be acquired", () => {
        beforeEach(() => {
          locationServices.setCoordinates(coordsA);
        });

        it("cannot be read synchronously", () => {
          let position: StdGeolocationPosition | undefined;
          geolocation.getCurrentPosition((nextPosition) => {
            position = nextPosition;
          });

          expect(position).toBeUndefined();
        });

        describe("when reading the position", () => {
          beforeEach(async () => {
            await getCurrentPosition(
              geolocation,
              successCallback,
              errorCallback,
            );
          });

          it("does not call the permission request handler", () => {
            expect(handlePermissionRequestA).not.toHaveBeenCalled();
          });

          it("calls the success callback with the position", () => {
            expect(successCallback).toHaveBeenCalledWith({
              coords: coordsA,
              timestamp: expect.any(Number) as number,
            });
          });

          it("does not call the error callback", () => {
            expect(errorCallback).not.toHaveBeenCalled();
          });
        });

        describe("when the coords change", () => {
          beforeEach(() => {
            locationServices.setCoordinates(coordsB);
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
              expect(successCallback).toHaveBeenCalledWith({
                coords: coordsB,
                timestamp: expect.any(Number) as number,
              });
            });

            it("does not call the error callback", () => {
              expect(errorCallback).not.toHaveBeenCalled();
            });
          });
        });
      });

      describe("when reading the position with a timeout", () => {
        describe("when the timeout is not exceeded", () => {
          describe("when coords can be acquired", () => {
            beforeEach(async () => {
              locationServices.setCoordinates(coordsA);

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
              expect(successCallback).toHaveBeenCalledWith({
                coords: coordsA,
                timestamp: expect.any(Number) as number,
              });
            });
          });

          describe("when coords cannot be acquired", () => {
            beforeEach(async () => {
              locationServices.setCoordinates(undefined);

              await getCurrentPosition(
                geolocation,
                successCallback,
                errorCallback,
                {
                  timeout: 1000,
                },
              );
            });

            it("calls the error callback with a GeolocationPositionError with a code of POSITION_UNAVAILABLE and an empty message", async () => {
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(
                GeolocationPositionError.POSITION_UNAVAILABLE,
              );
              expect(error.message).toBe("");
            });
          });
        });

        describe("when the timeout is exceeded", () => {
          beforeEach(async () => {
            locationServices.setCoordinates(coordsA);

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
            expect(errorCallback).toHaveBeenCalled();
            expect(errorCallback.mock.calls[0][0]).toBeDefined();

            const error = errorCallback.mock
              .calls[0][0] as GeolocationPositionError;

            expect(error).toBeInstanceOf(GeolocationPositionError);
            expect(error.code).toBe(GeolocationPositionError.TIMEOUT);
            expect(error.message).toBe("");
          });
        });

        describe("when the timeout is negative", () => {
          beforeEach(async () => {
            locationServices.setCoordinates(coordsA);

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
            expect(errorCallback).toHaveBeenCalled();
            expect(errorCallback.mock.calls[0][0]).toBeDefined();

            const error = errorCallback.mock
              .calls[0][0] as GeolocationPositionError;

            expect(error).toBeInstanceOf(GeolocationPositionError);
            expect(error.code).toBe(GeolocationPositionError.TIMEOUT);
            expect(error.message).toBe("");
          });
        });
      });
    });
  });

  describe("when there is no permission request handler", () => {
    beforeEach(() => {
      locationServices = createLocationServices();
      geolocation = createGeolocation({ locationServices });
    });

    describe("when permission has not been requested", () => {
      beforeEach(() => {
        locationServices.setPermissionState(PROMPT);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
          expect(errorCallback).toHaveBeenCalled();
          expect(errorCallback.mock.calls[0][0]).toBeDefined();

          const error = errorCallback.mock
            .calls[0][0] as GeolocationPositionError;

          expect(error).toBeInstanceOf(GeolocationPositionError);
          expect(error.code).toBe(GeolocationPositionError.PERMISSION_DENIED);
          expect(error.message).toBe("");
        });

        it("does not call the success callback", () => {
          expect(successCallback).not.toHaveBeenCalled();
        });
      });
    });

    describe("when permission is denied", () => {
      beforeEach(() => {
        locationServices.setPermissionState(DENIED);
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the error callback with a GeolocationPositionError with a code of PERMISSION_DENIED and an empty message", () => {
          expect(errorCallback).toHaveBeenCalled();
          expect(errorCallback.mock.calls[0][0]).toBeDefined();

          const error = errorCallback.mock
            .calls[0][0] as GeolocationPositionError;

          expect(error).toBeInstanceOf(GeolocationPositionError);
          expect(error.code).toBe(GeolocationPositionError.PERMISSION_DENIED);
          expect(error.message).toBe("");
        });

        it("does not call the success callback", () => {
          expect(successCallback).not.toHaveBeenCalled();
        });
      });
    });

    describe("when permission is granted", () => {
      beforeEach(() => {
        locationServices.setPermissionState(GRANTED);
      });

      describe("when coords can be acquired", () => {
        beforeEach(() => {
          locationServices.setCoordinates(coordsA);
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
            expect(successCallback).toHaveBeenCalledWith({
              coords: coordsA,
              timestamp: expect.any(Number) as number,
            });
          });

          it("does not call the error callback", () => {
            expect(errorCallback).not.toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe("when reading the position will result in an error", () => {
    beforeEach(() => {
      locationServices = createLocationServices();
      locationServices.setPermissionState(DENIED);
      geolocation = createGeolocation({ locationServices });
    });

    describe("when reading the position with an error callback", () => {
      beforeEach(async () => {
        await getCurrentPosition(geolocation, successCallback, errorCallback);
      });

      it("calls the error callback with a GeolocationPositionError", () => {
        expect(errorCallback).toHaveBeenCalled();
        expect(errorCallback.mock.calls[0][0]).toBeDefined();

        const error = errorCallback.mock
          .calls[0][0] as GeolocationPositionError;

        expect(error).toBeInstanceOf(GeolocationPositionError);
      });

      it("does not call the success callback", () => {
        expect(successCallback).not.toHaveBeenCalled();
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
        expect(successCallback).not.toHaveBeenCalled();
      });
    });
  });
});

async function getCurrentPosition(
  geolocation: StdGeolocation,
  successCallback: StdPositionCallback,
  errorCallback?: StdPositionErrorCallback,
  options?: StdPositionOptions,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal) {
      if (signal.aborted) {
        resolve();
        return;
      }

      signal.addEventListener(
        "abort",
        () => {
          resolve();
        },
        { once: true },
      );
    }

    geolocation.getCurrentPosition(
      (position) => {
        successCallback(position);
        resolve();
      },
      errorCallback &&
        ((error) => {
          errorCallback(error);
          resolve();
        }),
      options,
    );
  });
}
