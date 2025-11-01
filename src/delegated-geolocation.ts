import { createPermissionDeniedError } from "./geolocation-position-error.js";

let canConstruct = false;

/**
 * Parameters for creating a delegated Geolocation API.
 *
 * @see {@link createDelegatedGeolocation} to create a delegated Geolocation
 *   API.
 */
export interface DelegatedGeolocationParameters {
  /**
   * The Geolocation APIs to delegate to.
   *
   * The list must have at least one delegate, which will be selected initially.
   * The list is static, and cannot be changed after the delegated API is
   * created.
   */
  delegates: globalThis.Geolocation[];

  /**
   * The Permissions APIs associated with each Geolocation API delegate.
   *
   * The map must contain a Permissions API for each Geolocation API
   * delegate.
   */
  permissionsDelegates: Map<globalThis.Geolocation, globalThis.Permissions>;
}

/**
 * The result of calling {@link createDelegatedGeolocation}.
 */
export interface DelegatedGeolocationResult {
  /**
   * The delegated Geolocation API.
   */
  readonly geolocation: globalThis.Geolocation;

  /**
   * A handle for controlling the delegated Geolocation API.
   */
  readonly handle: DelegatedGeolocationHandle;
}

/**
 * A handle for controlling a delegated Geolocation API.
 */
export interface DelegatedGeolocationHandle {
  /**
   * Select a Geolocation API delegate.
   *
   * @param delegate - The delegate to select.
   */
  selectDelegate: (delegate: globalThis.Geolocation) => void;

  /**
   * Get the selected Geolocation API delegate.
   *
   * @returns The selected delegate.
   */
  selectedDelegate: () => globalThis.Geolocation;

  /**
   * Check if a Geolocation API delegate is selected.
   *
   * @param delegate - The delegate to check.
   *
   * @returns `true` if the delegate is selected, `false` otherwise.
   */
  isSelectedDelegate: (delegate: globalThis.Geolocation) => boolean;
}

/**
 * Create a Geolocation API that delegates to other Geolocation APIs.
 *
 * Delegated Geolocation APIs can be used, for example, to dynamically "switch"
 * between a fake Geolocation API and a real Geolocation API.
 *
 * When
 * {@link globalThis.Geolocation.getCurrentPosition | Geolocation.getCurrentPosition}
 * is called on the delegated Geolocation API, the call will be forwarded to the
 * selected delegate.
 *
 * Geolocation API delegates can be selected dynamically at any time, and any
 * position watches created with
 * {@link globalThis.Geolocation.watchPosition | Geolocation.watchPosition} will
 * immediately be called with the new delegate's position.
 *
 * @param params - The parameters for creating the delegated Geolocation API.
 *
 * @returns The delegated Geolocation API, and a handle for controlling it.
 * @throws A {@link TypeError} if no delegates are provided.
 *
 * @inlineType DelegatedGeolocationParameters
 */
export function createDelegatedGeolocation(
  params: DelegatedGeolocationParameters,
): DelegatedGeolocationResult {
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

  const geolocation = new Geolocation({
    delegate() {
      return delegate;
    },

    permissionsDelegate() {
      const permissions = permissionsDelegates.get(delegate);
      /* v8 ignore start: unlikely because of constructor assertion -- @preserve */
      if (!permissions) throw new TypeError("Missing permissions delegate");
      /* v8 ignore stop -- @preserve */

      return permissions;
    },

    subscribe(subscriber) {
      subscribers.add(subscriber);
    },

    unsubscribe(subscriber) {
      subscribers.delete(subscriber);
    },
  });

  const handle: DelegatedGeolocationHandle = {
    selectDelegate(nextDelegate) {
      delegate = nextDelegate;

      for (const subscriber of subscribers) {
        try {
          subscriber();
          /* v8 ignore start: impossible to test under Vitest -- @preserve */
        } catch (error) {
          // Throw subscriber errors asynchronously, so that users will at least
          // see it in the console and notice that their subscriber throws.
          queueMicrotask(() => {
            throw error;
          });
        }
        /* v8 ignore stop -- @preserve */
      }
    },

    selectedDelegate() {
      return delegate;
    },

    isSelectedDelegate(query) {
      return query === delegate;
    },
  };

  return {
    geolocation,
    handle,
  };
}

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
              /* v8 ignore start: difficult to test cases with no error callback -- @preserve */
              errorCallback?.(createPermissionDeniedError(""));
              /* v8 ignore stop -- @preserve */

              const onPermissionChange = () => {
                /* v8 ignore start: can't change from "prompt" to "prompt" -- @preserve */
                if (permissionStatus.state === "prompt") return;
                /* v8 ignore stop -- @preserve */

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

            /* v8 ignore start: hard to deliberately induce an error here -- @preserve */
          } catch {
            // ignored
          }
          /* v8 ignore stop -- @preserve */
        }
      })().catch(
        /* v8 ignore start: promise failsafe, can't occur normally -- @preserve */
        () => {},
        /* v8 ignore stop -- @preserve */
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
