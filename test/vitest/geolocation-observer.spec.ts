import {
  createAPIs,
  createGeolocationObserver,
  GeolocationPositionError,
  type MutableLocationServices,
} from "fake-geolocation";
import type { PermissionStore } from "fake-permissions";
import { beforeEach, describe, expect, it } from "vitest";
import { coordsA, coordsB, coordsC, coordsD } from "../fixture/coords.js";

describe("GeolocationObserver", () => {
  let permissions: Permissions;
  let permissionStore: PermissionStore;
  let locationServices: MutableLocationServices;
  let geolocation: Geolocation;

  beforeEach(() => {
    ({ permissions, permissionStore, locationServices, geolocation } =
      createAPIs());
  });

  describe("waitForCoordinates()", () => {
    describe("when called with no matchers", () => {
      it("resolves when any coords are already acquired", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(observer.waitForCoordinates()).resolves.toBeUndefined();
      });

      it("resolves when any coords are subsequently acquired", async () => {
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer.waitForCoordinates().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");

        await expect(promise).resolves.toBeUndefined();
      });

      it("doesn't resolve when coords are not acquired", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        locationServices.disable();
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer.waitForCoordinates().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.enable();

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with a single matcher", () => {
      it("resolves when the coords already match the matcher", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(
          observer.waitForCoordinates(coordsA),
        ).resolves.toBeUndefined();
      });

      it("resolves when the coords change to match the matcher", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer.waitForCoordinates(coordsB).then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsB);

        await expect(promise).resolves.toBeUndefined();
      });

      it("doesn't resolve when the coords change but don't match the matcher", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer.waitForCoordinates(coordsB).then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsC);
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsB);

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with multiple matchers", () => {
      it("resolves when the coords already match any of the matchers", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(
          observer.waitForCoordinates([coordsA, coordsB]),
        ).resolves.toBeUndefined();
        await expect(
          observer.waitForCoordinates([coordsB, coordsA]),
        ).resolves.toBeUndefined();
      });

      it("resolves when the coords change to match any of the matchers", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForCoordinates([coordsB, coordsC])
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsC);

        await expect(promise).resolves.toBeUndefined();
      });

      it("doesn't resolve when the coords change but don't match any of the matchers", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForCoordinates([coordsB, coordsC])
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsD);
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsB);

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with a partial matcher", () => {
      it("resolves when the coords match", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(
          observer.waitForCoordinates({ latitude: coordsA.latitude }),
        ).resolves.toBeUndefined();
      });

      it("doesn't resolve when the coords don't match", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForCoordinates({ latitude: coordsB.latitude })
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsC);
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsB);

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with an async task function", () => {
      it("runs the task while waiting", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(
          observer.waitForCoordinates(coordsB, async () => {
            locationServices.setLowAccuracyCoordinates(coordsB);
          }),
        ).resolves.toBeUndefined();
      });
    });

    describe("when called with position options", () => {
      it("uses the provided options", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForCoordinates(undefined, undefined, {
            enableHighAccuracy: true,
          })
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setHighAccuracyCoordinates(coordsA);

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when an error has been received after a position was acquired", () => {
      it("doesn't resolve until a new position is acquired", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();
        locationServices.setLowAccuracyCoordinates(undefined);
        await runTaskQueue();

        let isResolved = false;
        const promise = observer.waitForCoordinates().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(coordsA);

        await expect(promise).resolves.toBeUndefined();
      });
    });
  });

  describe("waitForPositionError()", () => {
    describe("when called with no codes", () => {
      it("resolves when any error has already been received", async () => {
        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(observer.waitForPositionError()).resolves.toBeUndefined();
      });

      it("resolves when any error is subsequently received", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        let isResolved = false;
        const promise = observer.waitForPositionError().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");

        await expect(promise).resolves.toBeUndefined();
      });

      it("doesn't resolve when no error is received", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        let isResolved = false;
        const promise = observer.waitForPositionError().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with a single code", () => {
      it("resolves when the most recently received error already matches the code", async () => {
        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(
          observer.waitForPositionError(
            GeolocationPositionError.PERMISSION_DENIED,
          ),
        ).resolves.toBeUndefined();
      });

      it("resolves when an error is received that matches the code", async () => {
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForPositionError(GeolocationPositionError.PERMISSION_DENIED)
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");

        await expect(promise).resolves.toBeUndefined();
      });

      it("doesn't resolve when an error is received that doesn't match the code", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForPositionError(GeolocationPositionError.POSITION_UNAVAILABLE)
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.disable();
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with multiple codes", () => {
      it("resolves when the most recently received error already matches any of the codes", async () => {
        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();

        await expect(
          observer.waitForPositionError([
            GeolocationPositionError.PERMISSION_DENIED,
            GeolocationPositionError.POSITION_UNAVAILABLE,
          ]),
        ).resolves.toBeUndefined();
        await expect(
          observer.waitForPositionError([
            GeolocationPositionError.POSITION_UNAVAILABLE,
            GeolocationPositionError.PERMISSION_DENIED,
          ]),
        ).resolves.toBeUndefined();
      });

      it("resolves when an error is received that matches any of the codes", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForPositionError([
            GeolocationPositionError.POSITION_UNAVAILABLE,
            GeolocationPositionError.PERMISSION_DENIED,
          ])
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");

        await expect(promise).resolves.toBeUndefined();
      });

      it("doesn't resolve when an error is received that doesn't match any of the codes", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        let isResolved = false;
        const promise = observer
          .waitForPositionError([
            GeolocationPositionError.TIMEOUT,
            GeolocationPositionError.PERMISSION_DENIED,
          ])
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.disable();
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("when called with an async task function", () => {
      it("runs the task while waiting", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        await expect(
          observer.waitForPositionError(
            GeolocationPositionError.PERMISSION_DENIED,
            async () => {
              permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");
            },
          ),
        ).resolves.toBeUndefined();
      });
    });

    describe("when called with position options", () => {
      it("uses the provided options", async () => {
        ({ permissionStore, locationServices, geolocation } = createAPIs({
          acquireDelay: 0,
        }));
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);

        await expect(
          observer.waitForPositionError(
            GeolocationPositionError.TIMEOUT,
            undefined,
            {
              timeout: 0,
            },
          ),
        ).resolves.toBeUndefined();
      });
    });

    describe("when a coords have been acquired after an error was received", () => {
      it("doesn't resolve until a new error is received", async () => {
        locationServices.setLowAccuracyCoordinates(undefined);
        permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        await runTaskQueue();
        const observer = createGeolocationObserver(geolocation, permissions);
        await runTaskQueue();
        locationServices.setLowAccuracyCoordinates(coordsA);
        await runTaskQueue();

        let isResolved = false;
        const promise = observer.waitForPositionError().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setLowAccuracyCoordinates(undefined);

        await expect(promise).resolves.toBeUndefined();
      });
    });
  });

  describe("waitForPermissionState()", () => {
    it("delegates to the permission observer", async () => {
      permissionStore.setStatus({ name: "geolocation" }, "BLOCKED");
      await runTaskQueue();
      const observer = createGeolocationObserver(geolocation, permissions);
      await runTaskQueue();

      await expect(
        observer.waitForPermissionState("granted", async () => {
          permissionStore.setStatus({ name: "geolocation" }, "GRANTED");
        }),
      ).resolves.toBeUndefined();
    });
  });
});

async function runTaskQueue(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 0);
  });
}
