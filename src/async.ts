export type SyncOrAsync<T> = T | Promise<T>;

export async function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
}
