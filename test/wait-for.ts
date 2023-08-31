/**
 * Calls the given function repeatedly until it stops throwing errors, or the
 * timeout is exceeded.
 */
export function waitFor<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const delay = 20;
    const timeout = 1000;
    let elapsed = 0;
    let error: unknown;

    const intervalId = setInterval(() => {
      elapsed += delay;

      try {
        resolve(fn());
        clearInterval(intervalId);
      } catch (e) {
        error = e;
      }

      if (elapsed >= timeout) {
        clearInterval(intervalId);
        reject(error ?? new Error("Timed out"));
      }
    }, delay);
  });
}
