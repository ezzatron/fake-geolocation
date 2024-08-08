import {
  createAPIs,
  createCoordinates,
  PERMISSION_DENIED,
  POSITION_UNAVAILABLE,
} from "fake-geolocation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.mocked(console.log).mockRestore();
});

describe("Geolocation observers", () => {
  it("works", async () => {
    const { geolocation, observer, permissions, user } = createAPIs();

    // We need some coords to start with
    const coordsA = createCoordinates({ latitude: 1, longitude: 2 });
    const coordsB = createCoordinates({ latitude: 3, longitude: 4 });

    // Jump to some coords and grant permission
    user.jumpToCoordinates(coordsA);
    user.grantAccess({ name: "geolocation" });

    // Start watching the position
    let position: GeolocationPosition | undefined;
    let error: GeolocationPositionError | undefined;
    geolocation.watchPosition(
      (p) => {
        position = p;
      },
      (e) => {
        error = e;
      },
    );

    // Start a Permissions API query
    const status = await permissions.query({ name: "geolocation" });

    // Wait for the position to be at coordsA
    await observer.waitForCoordinates(coordsA);
    // Outputs "true"
    console.log(position?.coords.latitude === coordsA.latitude);

    // Wait for the position to be at coordsA OR coordsB
    await observer.waitForCoordinates([coordsA, coordsB]);
    // Outputs "true"
    console.log(position?.coords.latitude === coordsA.latitude);

    // Wait for the position to have a latitude of 1
    await observer.waitForCoordinates({ latitude: 1 });
    // Outputs "true"
    console.log(position?.coords.latitude === 1);

    // Wait for the position to be at coordsB, while running a task
    await observer.waitForCoordinates(coordsB, async () => {
      user.jumpToCoordinates(coordsB);
    });
    // Outputs "true"
    console.log(position?.coords.latitude === coordsB.latitude);

    // Wait for the position to be at coordsB, using high accuracy
    await observer.waitForCoordinates(coordsB, undefined, {
      enableHighAccuracy: true,
    });
    // Outputs "true"
    console.log(position?.coords.latitude === coordsB.latitude);

    user.disableLocationServices();

    // Wait for a POSITION_UNAVAILABLE error
    await observer.waitForPositionError(POSITION_UNAVAILABLE);
    // Outputs "true"
    console.log(error?.code === POSITION_UNAVAILABLE);

    // Wait for a POSITION_UNAVAILABLE OR PERMISSION_DENIED error
    await observer.waitForPositionError([
      POSITION_UNAVAILABLE,
      PERMISSION_DENIED,
    ]);
    // Outputs "true"
    console.log(error?.code === POSITION_UNAVAILABLE);

    // Wait for a PERMISSION_DENIED error, while running a task
    await observer.waitForPositionError(PERMISSION_DENIED, async () => {
      user.blockAccess({ name: "geolocation" });
    });
    // Outputs "true"
    console.log(error?.code === PERMISSION_DENIED);

    // You can also wait for geolocation permission states
    await observer.waitForPermissionState("granted", async () => {
      user.grantAccess({ name: "geolocation" });
    });
    // Outputs "true"
    console.log(status.state === "granted");

    expect(vi.mocked(console.log).mock.calls).toEqual([
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
    ]);
  });
});
