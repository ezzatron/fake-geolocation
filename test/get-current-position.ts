import {
  StdGeolocation,
  StdPositionCallback,
  StdPositionErrorCallback,
  StdPositionOptions,
} from "../src/types/std.js";

export async function getCurrentPosition(
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
