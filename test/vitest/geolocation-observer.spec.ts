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
  let permissionStore: PermissionStore;
  let locationServices: MutableLocationServices;
  let geolocation: Geolocation;

  describe("when created with default options", () => {
    beforeEach(() => {
      ({ permissionStore, locationServices, geolocation } = createAPIs());
    });

    describe("waitForCoordinates()", () => {
      describe("when called with no matchers", () => {
        it("resolves when any coords are already acquired", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(observer.waitForCoordinates()).resolves.toBeUndefined();
        });

        it("resolves when any coords are subsequently acquired", async () => {
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer.waitForCoordinates().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when coords are not acquired", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          locationServices.disable();
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForCoordinates(coordsA),
          ).resolves.toBeUndefined();
        });

        it("resolves when the coords change to match the matcher", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForCoordinates({ latitude: coordsA.latitude }),
          ).resolves.toBeUndefined();
        });

        it("doesn't resolve when the coords don't match", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForCoordinates(coordsB, async () => {
              locationServices.setLowAccuracyCoordinates(coordsB);
            }),
          ).resolves.toBeUndefined();
        });
      });

      describe("when an error has been received after a position was acquired", () => {
        it("doesn't resolve until a new position is acquired", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
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

    describe("waitForCoordinatesChange()", () => {
      describe("when called with no matchers", () => {
        it("doesn't resolve when any coords are already acquired", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer.waitForCoordinatesChange().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.setLowAccuracyCoordinates(coordsB);

          await expect(promise).resolves.toBeUndefined();
        });

        it.each([[], [[]]])(
          "resolves when any coords are subsequently acquired",
          async (...args) => {
            locationServices.setLowAccuracyCoordinates(coordsA);
            permissionStore.set({ name: "geolocation" }, "granted");
            await runTaskQueue();
            const observer = await createGeolocationObserver(geolocation);
            await runTaskQueue();

            let isResolved = false;
            const promise = observer
              .waitForCoordinatesChange(...args)
              .then(() => {
                isResolved = true;

                return;
              });
            await runTaskQueue();

            expect(isResolved).toBe(false);

            locationServices.setLowAccuracyCoordinates(coordsB);

            await expect(promise).resolves.toBeUndefined();
          },
        );

        it("doesn't resolve when coords are not acquired", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          locationServices.disable();
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer.waitForCoordinatesChange().then(() => {
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
        it("resolves when the coords change to match the matcher", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForCoordinatesChange(coordsB)
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.setLowAccuracyCoordinates(coordsB);

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when the coords already match the matcher", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer
            .waitForCoordinatesChange(coordsA)
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.setLowAccuracyCoordinates(coordsB);
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.setLowAccuracyCoordinates(coordsA);

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when the coords change but don't match the matcher", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForCoordinatesChange(coordsB)
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

      describe("when called with multiple matchers", () => {
        it("resolves when the coords change to match any of the matchers", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForCoordinatesChange([coordsB, coordsC])
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.setLowAccuracyCoordinates(coordsC);

          await expect(promise).resolves.toBeUndefined();
        });

        it.each([[coordsA], [coordsB]] as const)(
          "doesn't resolve when the coords already match one of the matchers",
          async (initialCoords) => {
            locationServices.setLowAccuracyCoordinates(initialCoords);
            permissionStore.set({ name: "geolocation" }, "granted");
            await runTaskQueue();
            const observer = await createGeolocationObserver(geolocation);
            await runTaskQueue();

            let isResolved = false;
            const promise = observer
              .waitForCoordinatesChange([coordsD, initialCoords])
              .then(() => {
                isResolved = true;

                return;
              });
            await runTaskQueue();

            expect(isResolved).toBe(false);

            locationServices.setLowAccuracyCoordinates(coordsC);
            await runTaskQueue();

            expect(isResolved).toBe(false);

            locationServices.setLowAccuracyCoordinates(initialCoords);

            await expect(promise).resolves.toBeUndefined();
          },
        );

        it("doesn't resolve when the coords change but don't match any of the matchers", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForCoordinatesChange([coordsB, coordsC])
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
        it("resolves when the coords change to match", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForCoordinatesChange(
              { latitude: coordsB.latitude },
              async () => {
                locationServices.setLowAccuracyCoordinates(coordsB);
              },
            ),
          ).resolves.toBeUndefined();
        });

        it("doesn't resolve when the coords change but don't match", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForCoordinatesChange({ latitude: coordsB.latitude })
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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForCoordinatesChange(coordsB, async () => {
              locationServices.setLowAccuracyCoordinates(coordsB);
            }),
          ).resolves.toBeUndefined();
        });
      });
    });

    describe("waitForPositionError()", () => {
      describe("when called with no codes", () => {
        it("resolves when any error has already been received", async () => {
          permissionStore.set({ name: "geolocation" }, "denied");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForPositionError(),
          ).resolves.toBeUndefined();
        });

        it("resolves when any error is subsequently received", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer.waitForPositionError().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when no error is received", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer.waitForPositionError().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });
      });

      describe("when called with a single code", () => {
        it("resolves when the most recently received error already matches the code", async () => {
          permissionStore.set({ name: "geolocation" }, "denied");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          await expect(
            observer.waitForPositionError(
              GeolocationPositionError.PERMISSION_DENIED,
            ),
          ).resolves.toBeUndefined();
        });

        it("resolves when an error is received that matches the code", async () => {
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForPositionError(GeolocationPositionError.PERMISSION_DENIED)
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when an error is received that doesn't match the code", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForPositionError(GeolocationPositionError.POSITION_UNAVAILABLE)
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.disable();
          permissionStore.set({ name: "geolocation" }, "granted");

          await expect(promise).resolves.toBeUndefined();
        });
      });

      describe("when called with multiple codes", () => {
        it("resolves when the most recently received error already matches any of the codes", async () => {
          permissionStore.set({ name: "geolocation" }, "denied");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
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
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when an error is received that doesn't match any of the codes", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

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

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });
      });

      describe("when called with an async task function", () => {
        it("runs the task while waiting", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          await expect(
            observer.waitForPositionError(
              GeolocationPositionError.PERMISSION_DENIED,
              async () => {
                permissionStore.set({ name: "geolocation" }, "denied");
              },
            ),
          ).resolves.toBeUndefined();
        });
      });

      describe("when a coords have been acquired after an error was received", () => {
        it("doesn't resolve until a new error is received", async () => {
          locationServices.setLowAccuracyCoordinates(undefined);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
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

    describe("waitForPositionErrorChange()", () => {
      describe("when called with no codes", () => {
        it("resolves when any error is subsequently received", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer.waitForPositionErrorChange().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when any error is already received", async () => {
          locationServices.setLowAccuracyCoordinates(undefined);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer.waitForPositionErrorChange().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when no error is received", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer.waitForPositionErrorChange().then(() => {
            isResolved = true;

            return;
          });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });
      });

      describe("when called with a single code", () => {
        it("resolves when an error is received that matches the code", async () => {
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForPositionErrorChange(
              GeolocationPositionError.PERMISSION_DENIED,
            )
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when the most recently received error already matches the code", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "denied");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer
            .waitForPositionErrorChange(
              GeolocationPositionError.PERMISSION_DENIED,
            )
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when an error is received that doesn't match the code", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForPositionErrorChange(
              GeolocationPositionError.POSITION_UNAVAILABLE,
            )
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");
          await runTaskQueue();

          expect(isResolved).toBe(false);

          locationServices.disable();
          permissionStore.set({ name: "geolocation" }, "granted");

          await expect(promise).resolves.toBeUndefined();
        });
      });

      describe("when called with multiple codes", () => {
        it("resolves when an error is received that matches any of the codes", async () => {
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer
            .waitForPositionErrorChange([
              GeolocationPositionError.POSITION_UNAVAILABLE,
              GeolocationPositionError.PERMISSION_DENIED,
            ])
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when the most recently received error already matches one of the codes", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "denied");

          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);
          await runTaskQueue();

          let isResolved = false;
          const promise = observer
            .waitForPositionErrorChange([
              GeolocationPositionError.PERMISSION_DENIED,
              GeolocationPositionError.POSITION_UNAVAILABLE,
            ])
            .then(() => {
              isResolved = true;

              return;
            });
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();

          expect(isResolved).toBe(false);

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });

        it("doesn't resolve when an error is received that doesn't match any of the codes", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          let isResolved = false;
          const promise = observer
            .waitForPositionErrorChange([
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

          permissionStore.set({ name: "geolocation" }, "denied");

          await expect(promise).resolves.toBeUndefined();
        });
      });

      describe("when called with an async task function", () => {
        it("runs the task while waiting", async () => {
          locationServices.setLowAccuracyCoordinates(coordsA);
          permissionStore.set({ name: "geolocation" }, "granted");
          await runTaskQueue();
          const observer = await createGeolocationObserver(geolocation);

          await expect(
            observer.waitForPositionErrorChange(
              GeolocationPositionError.PERMISSION_DENIED,
              async () => {
                permissionStore.set({ name: "geolocation" }, "denied");
              },
            ),
          ).resolves.toBeUndefined();
        });
      });
    });
  });

  describe("when created with non-default options", () => {
    beforeEach(() => {
      ({ permissionStore, locationServices, geolocation } = createAPIs({
        acquireDelay: 0,
      }));
    });

    describe("waitForCoordinates()", () => {
      it("uses the provided options", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.set({ name: "geolocation" }, "granted");
        await runTaskQueue();
        const observer = await createGeolocationObserver(geolocation, {
          enableHighAccuracy: true,
        });

        let isResolved = false;
        const promise = observer.waitForCoordinates().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setHighAccuracyCoordinates(coordsA);

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("waitForCoordinatesChange()", () => {
      it("uses the provided options", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.set({ name: "geolocation" }, "granted");
        await runTaskQueue();
        const observer = await createGeolocationObserver(geolocation, {
          enableHighAccuracy: true,
        });

        let isResolved = false;
        const promise = observer.waitForCoordinatesChange().then(() => {
          isResolved = true;

          return;
        });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        locationServices.setHighAccuracyCoordinates(coordsA);

        await expect(promise).resolves.toBeUndefined();
      });
    });

    describe("waitForPositionError()", () => {
      it("uses the provided options", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.set({ name: "geolocation" }, "granted");
        await runTaskQueue();
        const observer = await createGeolocationObserver(geolocation, {
          timeout: 0,
        });

        await expect(
          observer.waitForPositionError(GeolocationPositionError.TIMEOUT),
        ).resolves.toBeUndefined();
      });
    });

    describe("waitForPositionErrorChange()", () => {
      it("uses the provided options", async () => {
        locationServices.setLowAccuracyCoordinates(coordsA);
        permissionStore.set({ name: "geolocation" }, "denied");
        await runTaskQueue();
        const observer = await createGeolocationObserver(geolocation, {
          timeout: 0,
        });
        await runTaskQueue();

        let isResolved = false;
        const promise = observer
          .waitForPositionErrorChange(GeolocationPositionError.TIMEOUT)
          .then(() => {
            isResolved = true;

            return;
          });
        await runTaskQueue();

        expect(isResolved).toBe(false);

        permissionStore.set({ name: "geolocation" }, "granted");

        await expect(promise).resolves.toBeUndefined();
      });
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
