import { compareCoordinates } from "./compare-coordinates.js";

export async function waitForCoordinates(
  geolocation: Geolocation,
  coords: GeolocationCoordinates,
  options?: PositionOptions,
): Promise<void> {
  return new Promise((resolve) => {
    const watchId = geolocation.watchPosition(
      (p) => {
        if (compareCoordinates(p.coords, coords) === 0) {
          geolocation.clearWatch(watchId);
          resolve();
        }
      },
      undefined,
      options,
    );
  });
}
