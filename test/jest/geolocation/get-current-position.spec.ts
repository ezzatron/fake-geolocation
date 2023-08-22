import { jest } from "@jest/globals";
import {
  HandlePermissionRequest,
  Permissions,
  createPermissionStore,
  createPermissions,
} from "fake-permissions";
import { GEOLOCATION } from "fake-permissions/constants/permission-name";
import {
  DENIED,
  GRANTED,
  PROMPT,
} from "fake-permissions/constants/permission-state";
import { sleep } from "../../../src/async.js";
import {
  GeolocationPositionError,
  MutableLocationServices,
  User,
  createGeolocation,
  createLocationServices,
  createPosition,
  createUser,
} from "../../../src/index.js";
import {
  StdGeolocation,
  StdGeolocationCoordinates,
  StdGeolocationPosition,
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
  const startTime = 100;
  let locationServices: MutableLocationServices;
  let permissions: Permissions<typeof GEOLOCATION>;
  let handlePermissionRequest: jest.Mock<
    HandlePermissionRequest<typeof GEOLOCATION>
  >;
  let user: User;
  let geolocation: StdGeolocation;

  let successCallback: jest.Mock;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    jest.setSystemTime(startTime);

    locationServices = createLocationServices();

    const permissionStore = createPermissionStore({
      initialStates: new Map([[{ name: GEOLOCATION }, PROMPT]]),
    });
    permissions = createPermissions({ permissionStore });

    handlePermissionRequest =
      jest.fn<HandlePermissionRequest<typeof GEOLOCATION>>();
    user = createUser({
      locationServices,
      permissionStore,
      handlePermissionRequest,
    });

    geolocation = createGeolocation({
      async requestPermission(descriptor) {
        return user.requestPermission(descriptor);
      },

      locationServices,
      permissions,
    });

    successCallback = jest.fn();
    errorCallback = jest.fn();
  });

  describe("when permission has not been requested", () => {
    beforeEach(() => {
      user.resetPermission({ name: GEOLOCATION });
    });

    describe("when coords can be acquired", () => {
      beforeEach(() => {
        locationServices.setCoordinates(coordsA);
      });

      describe("when the user closes the permission dialog immediately", () => {
        beforeEach(() => {
          handlePermissionRequest.mockReturnValue(PROMPT);
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
            expect(error.code).toBe(GeolocationPositionError.PERMISSION_DENIED);
            expect(error.message).toBe("");
          });

          it("does not call the success callback", () => {
            expect(successCallback).not.toHaveBeenCalled();
          });
        });
      });

      describe("when the user closes the permission dialog after a delay", () => {
        beforeEach(() => {
          handlePermissionRequest.mockImplementation(
            async (): Promise<PermissionState> => {
              await sleep(60);

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
                timeout: 40,
              },
            );
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
        });
      });

      describe("when the user denies the permission immediately", () => {
        beforeEach(() => {
          handlePermissionRequest.mockReturnValue(DENIED);
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
            expect(error.code).toBe(GeolocationPositionError.PERMISSION_DENIED);
            expect(error.message).toBe("");
          });

          it("does not call the success callback", () => {
            expect(successCallback).not.toHaveBeenCalled();
          });
        });
      });

      describe("when the user denies the permission after a delay", () => {
        beforeEach(() => {
          handlePermissionRequest.mockImplementation(
            async (): Promise<PermissionState> => {
              await sleep(60);

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
                timeout: 40,
              },
            );
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
        });
      });

      describe("when the user grants the permission immediately", () => {
        beforeEach(() => {
          handlePermissionRequest.mockReturnValue(GRANTED);
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
            expect(successCallback).toHaveBeenCalledWith(
              createPosition(coordsA, startTime, false),
            );
          });

          it("does not call the error callback", () => {
            expect(errorCallback).not.toHaveBeenCalled();
          });
        });
      });

      describe("when the user grants the permission after a delay", () => {
        const delay = 60;

        beforeEach(() => {
          handlePermissionRequest.mockImplementation(
            async (): Promise<PermissionState> => {
              await sleep(60);

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
                timeout: delay - 20,
              },
            );
          });

          it("does not include the time spent waiting for permission in the timeout", () => {
            expect(successCallback).toHaveBeenCalledWith(
              createPosition(coordsA, startTime + delay, false),
            );
          });
        });
      });
    });

    describe("when coords cannot be acquired", () => {
      beforeEach(() => {
        locationServices.setCoordinates(undefined);
      });

      describe("when the user grants the permission", () => {
        beforeEach(() => {
          handlePermissionRequest.mockReturnValue(GRANTED);
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
      user.denyPermission({ name: GEOLOCATION });
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
      user.grantPermission({ name: GEOLOCATION });
    });

    describe("when acquiring coords throws an error", () => {
      beforeEach(() => {
        jest
          .spyOn(locationServices, "acquireCoordinates")
          .mockRejectedValue(new Error("An error occurred"));
      });

      describe("when reading the position", () => {
        beforeEach(async () => {
          await getCurrentPosition(geolocation, successCallback, errorCallback);
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
          await getCurrentPosition(geolocation, successCallback, errorCallback);
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
          await getCurrentPosition(geolocation, successCallback, errorCallback);
        });

        it("calls the success callback with the position", () => {
          expect(successCallback).toHaveBeenCalledWith(
            createPosition(coordsA, startTime, false),
          );
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
            expect(successCallback).toHaveBeenCalledWith(
              createPosition(coordsB, startTime, false),
            );
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
            expect(successCallback).toHaveBeenCalledWith(
              createPosition(coordsA, startTime, false),
            );
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

    describe("when reading the position with a maximum age of Infinity", () => {
      beforeEach(async () => {
        locationServices.setCoordinates(coordsA);
      });

      describe("when there is a cached high accuracy position", () => {
        let cachedPosition: StdGeolocationPosition;

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

          locationServices.setCoordinates(coordsB);
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
            expect(successCallback).toHaveBeenCalledWith(cachedPosition);
            expect(successCallback.mock.calls[0][0]).toBe(cachedPosition);
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
            expect(successCallback).toHaveBeenCalledWith(cachedPosition);
            expect(successCallback.mock.calls[0][0]).toBe(cachedPosition);
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
              expect(successCallback).toHaveBeenCalledWith(cachedPosition);
              expect(successCallback.mock.calls[0][0]).toBe(cachedPosition);
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
              expect(successCallback).toHaveBeenCalledWith(cachedPosition);
              expect(successCallback.mock.calls[0][0]).toBe(cachedPosition);
            });
          });
        });
      });

      describe("when there is a cached low accuracy position", () => {
        let cachedPosition: StdGeolocationPosition;

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

          locationServices.setCoordinates(coordsB);
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
            expect(successCallback).toHaveBeenCalledWith(
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
            expect(cachedPosition).toMatchObject({ coords: coordsA });
            expect(successCallback).toHaveBeenCalledWith(cachedPosition);
            expect(successCallback.mock.calls[0][0]).toBe(cachedPosition);
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
              expect(errorCallback).toHaveBeenCalled();
              expect(errorCallback.mock.calls[0][0]).toBeDefined();

              const error = errorCallback.mock
                .calls[0][0] as GeolocationPositionError;

              expect(error).toBeInstanceOf(GeolocationPositionError);
              expect(error.code).toBe(GeolocationPositionError.TIMEOUT);
              expect(error.message).toBe("");
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
              expect(cachedPosition).toMatchObject({ coords: coordsA });
              expect(successCallback).toHaveBeenCalledWith(cachedPosition);
              expect(successCallback.mock.calls[0][0]).toBe(cachedPosition);
            });
          });
        });
      });
    });
  });

  describe("when reading the position will result in an error", () => {
    beforeEach(() => {
      handlePermissionRequest.mockReturnValue(DENIED);
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
