import { createPermissionDeniedError } from "./geolocation-position-error.js";

let canConstruct = false;

/**
 * @inline
 */
export interface DelegatedGeolocationParameters {
  delegates: globalThis.Geolocation[];
  permissionsDelegates: Map<globalThis.Geolocation, globalThis.Permissions>;
}

export function createDelegatedGeolocation(
  params: DelegatedGeolocationParameters,
): {
  geolocation: globalThis.Geolocation;
  selectDelegate: SelectDelegate;
  isDelegateSelected: IsDelegateSelected;
} {
  const { delegates, permissionsDelegates } = params;
  let [delegate] = delegates;
  if (!delegate) throw new TypeError("No delegates provided");

  for (let i = 0; i < delegates.length; ++i) {
    if (!permissionsDelegates.has(delegates[i])) {
      throw new TypeError(
        `Missing Permissions delegate for Geolocation delegate at index ${i}`,
      );
    }
  }

  const subscribers = new Set<Subscriber>();

  canConstruct = true;

  return {
    geolocation: new Geolocation({
      delegate() {
        return delegate;
      },

      permissionsDelegate() {
        const permissions = permissionsDelegates.get(delegate);
        /* v8 ignore start: unlikely because of constructor assertion */
        if (!permissions) throw new TypeError("Missing permissions delegate");
        /* v8 ignore stop */

        return permissions;
      },

      subscribe(subscriber) {
        subscribers.add(subscriber);
      },

      unsubscribe(subscriber) {
        subscribers.delete(subscriber);
      },
    }),

    selectDelegate(nextDelegate) {
      delegate = nextDelegate;

      for (const subscriber of subscribers) {
        try {
          subscriber();
          /* v8 ignore start: impossible to test under Vitest */
        } catch (error) {
          // Throw subscriber errors asynchronously, so that users will at least
          // see it in the console and notice that their subscriber throws.
          queueMicrotask(() => {
            throw error;
          });
        }
        /* v8 ignore stop */
      }
    },

    isDelegateSelected(query) {
      return query === delegate;
    },
  };
}

export type SelectDelegate = (delegate: globalThis.Geolocation) => void;
export type IsDelegateSelected = (delegate: globalThis.Geolocation) => boolean;

interface GeolocationParameters {
  delegate: () => globalThis.Geolocation;
  permissionsDelegate: () => globalThis.Permissions;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
}

export class Geolocation {
  /**
   * @deprecated Use the `createDelegatedGeolocation()` function instead.
   */
  constructor({
    delegate,
    permissionsDelegate,
    subscribe,
    unsubscribe,
  }: GeolocationParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#delegate = delegate;
    this.#permissionsDelegate = permissionsDelegate;
    this.#subscribe = subscribe;
    this.#unsubscribe = unsubscribe;
    this.#watchId = 1;
    this.watches = {};

    this.#handleDelegateChange = () => {
      (async () => {
        for (const watch of Object.values(this.watches)) {
          try {
            const permissions = this.#permissionsDelegate();
            const permissionStatus = await permissions.query({
              name: "geolocation",
            });

            watch.clear();

            const startWatching = () => {
              const delegate = this.#delegate();
              const delegateWatchId = delegate.watchPosition(...watch.args);
              watch.clear = () => {
                delegate.clearWatch(delegateWatchId);
              };
            };

            // switching delegates should not trigger a permission prompt
            if (permissionStatus.state === "prompt") {
              const [, errorCallback] = watch.args;
              /* v8 ignore start: difficult to test cases with no error callback */
              errorCallback?.(createPermissionDeniedError(""));
              /* v8 ignore stop */

              const onPermissionChange = () => {
                /* v8 ignore start: can't change from "prompt" to "prompt" */
                if (permissionStatus.state === "prompt") return;
                /* v8 ignore stop */

                watch.clear();
                startWatching();
              };

              permissionStatus.addEventListener("change", onPermissionChange);
              watch.clear = () => {
                permissionStatus.removeEventListener(
                  "change",
                  onPermissionChange,
                );
              };
            } else {
              startWatching();
            }

            /* v8 ignore start: hard to deliberately induce an error here */
          } catch {
            // ignored
          }
          /* v8 ignore stop */
        }
      })().catch(
        /* v8 ignore start: promise failsafe, can't occur normally */
        () => {},
        /* v8 ignore stop */
      );
    };
  }

  getCurrentPosition(...args: GetCurrentPositionParameters): void {
    this.#delegate().getCurrentPosition(...args);
  }

  watchPosition(...args: WatchPositionParameters): number {
    const delegate = this.#delegate();
    const delegateWatchId = delegate.watchPosition(...args);
    const clear = () => {
      delegate.clearWatch(delegateWatchId);
    };

    const watchId = this.#watchId++;
    this.watches[watchId] = { args, clear };

    this.#subscribe(this.#handleDelegateChange);

    return watchId;
  }

  clearWatch(watchId: number): void {
    const watch = this.watches[watchId];
    if (!watch) return;

    watch.clear();
    delete this.watches[watchId];

    if (Object.keys(this.watches).length < 1) {
      this.#unsubscribe(this.#handleDelegateChange);
    }
  }

  readonly [Symbol.toStringTag] = "Geolocation";

  readonly #delegate: () => globalThis.Geolocation;
  readonly #permissionsDelegate: () => globalThis.Permissions;
  readonly #subscribe: (subscriber: Subscriber) => void;
  readonly #unsubscribe: (subscriber: Subscriber) => void;
  #watchId: number;
  readonly watches: Record<number, Watch> = {};
  readonly #handleDelegateChange: () => void;
}

type Subscriber = () => void;

interface Watch {
  readonly args: WatchPositionParameters;
  clear: () => void;
}

type GetCurrentPositionParameters = Parameters<
  globalThis.Geolocation["getCurrentPosition"]
>;
type WatchPositionParameters = Parameters<
  globalThis.Geolocation["watchPosition"]
>;
