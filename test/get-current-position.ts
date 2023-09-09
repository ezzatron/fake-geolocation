export async function getCurrentPosition(
  geolocation: Geolocation,
  successCallback: PositionCallback,
  errorCallback?: PositionErrorCallback,
  options?: PositionOptions,
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
