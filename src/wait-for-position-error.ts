export async function waitForPositionError(
  geolocation: Geolocation,
  code?:
    | GeolocationPositionError["PERMISSION_DENIED"]
    | GeolocationPositionError["POSITION_UNAVAILABLE"]
    | GeolocationPositionError["TIMEOUT"],
  options?: PositionOptions,
): Promise<void> {
  return new Promise((resolve) => {
    const watchId = geolocation.watchPosition(
      () => {},
      (e) => {
        if (code == null || e.code === code) {
          geolocation.clearWatch(watchId);
          resolve();
        }
      },
      options,
    );
  });
}
