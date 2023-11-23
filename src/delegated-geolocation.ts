import { createPermissionDeniedError } from "./geolocation-position-error.js";

let canConstruct = false;

export function createDelegatedGeolocation({
  delegates,
  permissionsDelegates,
}: {
  delegates: globalThis.Geolocation[];
  permissionsDelegates: Map<globalThis.Geolocation, globalThis.Permissions>;
}): {
  geolocation: globalThis.Geolocation;
  selectDelegate: SelectDelegate;
  isDelegateSelected: IsDelegateSelected;
} {
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
        /* istanbul ignore next: unlikely because of constructor assertion */
        if (!permissions) throw new TypeError("Missing permissions delegate");

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
        } catch {
          // ignored
        }
      }
    },

    isDelegateSelected(query) {
      return query === delegate;
    },
  };
}

export type SelectDelegate = (delegate: globalThis.Geolocation) => void;
export type IsDelegateSelected = (delegate: globalThis.Geolocation) => boolean;

type GeolocationParameters = {
  delegate: () => globalThis.Geolocation;
  permissionsDelegate: () => globalThis.Permissions;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
};

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
              /* istanbul ignore next: difficult to test cases with no error callback */
              errorCallback?.(createPermissionDeniedError(""));

              const onPermissionChange = () => {
                /* istanbul ignore next: can't change from "prompt" to "prompt" */
                if (permissionStatus.state === "prompt") return;

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
          } catch {
            // ignored
          }
        }
      })().catch(
        /* istanbul ignore next: promise failsafe, can't occur normally */
        () => {},
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

  readonly #delegate: () => globalThis.Geolocation;
  readonly #permissionsDelegate: () => globalThis.Permissions;
  readonly #subscribe: (subscriber: Subscriber) => void;
  readonly #unsubscribe: (subscriber: Subscriber) => void;
  #watchId: number;
  readonly watches: Record<number, Watch> = {};
  readonly #handleDelegateChange: () => void;
}

type Subscriber = () => void;

type Watch = {
  readonly args: WatchPositionParameters;
  clear: () => void;
};

type GetCurrentPositionParameters = Parameters<
  globalThis.Geolocation["getCurrentPosition"]
>;
type WatchPositionParameters = Parameters<
  globalThis.Geolocation["watchPosition"]
>;
