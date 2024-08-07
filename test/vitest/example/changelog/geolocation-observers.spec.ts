import {
  createAPIs,
  createCoordinates,
  createGeolocationObserver,
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
    const { geolocation, user } = createAPIs();

    // We need some coords to start with
    const coordsA = createCoordinates({ latitude: 1, longitude: 2 });
    const coordsB = createCoordinates({ latitude: 3, longitude: 4 });

    // Jump to some coords and grant permission
    user.jumpToCoordinates(coordsA);
    user.grantPermission({ name: "geolocation" });

    // Start watching the position
    let position: GeolocationPosition | undefined;
    // let error: GeolocationPositionError | undefined;
    geolocation.watchPosition(
      (p) => {
        position = p;
      },
      // (e) => {
      //   error = e;
      // },
    );

    // Start observing high accuracy position changes and errors
    const observer = await createGeolocationObserver(geolocation, {
      enableHighAccuracy: true,
    });

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

    expect(vi.mocked(console.log).mock.calls).toEqual([
      [true],
      [true],
      [true],
      [true],
    ]);
  });
});
