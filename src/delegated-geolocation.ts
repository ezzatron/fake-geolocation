import { StdGeolocation } from "./types/std.js";

let canConstruct = false;

export function createDelegatedGeolocation({
  delegates,
}: {
  delegates: StdGeolocation[];
}): {
  geolocation: StdGeolocation;
  selectDelegate: SelectDelegate;
} {
  let [delegate] = delegates;
  if (!delegate) throw new TypeError("No delegates provided");

  const subscribers = new Set<Subscriber>();

  canConstruct = true;

  return {
    geolocation: new Geolocation({
      delegate() {
        return delegate;
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
  };
}

export type SelectDelegate = (delegate: StdGeolocation) => void;

type GeolocationParameters = {
  delegate: () => StdGeolocation;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
};

export class Geolocation {
  /**
   * @deprecated Use the `createDelegatedPermissions()` function instead.
   */
  constructor({ delegate, subscribe, unsubscribe }: GeolocationParameters) {
    if (!canConstruct) throw new TypeError("Illegal constructor");
    canConstruct = false;

    this.#delegate = delegate;
    this.#subscribe = subscribe;
    this.#unsubscribe = unsubscribe;
    this.#watchId = 1;
    this.watches = {};

    this.#handleDelegateChange = () => {
      for (const watch of Object.values(this.watches)) {
        try {
          const { args, delegate, delegateWatchId } = watch;
          const nextDelegate = this.#delegate();

          delegate.clearWatch(delegateWatchId);
          watch.delegate = nextDelegate;
          watch.delegateWatchId = nextDelegate.watchPosition(...args);
        } catch {
          // ignored
        }
      }
    };
  }

  getCurrentPosition(...args: GetCurrentPositionParameters): void {
    this.#delegate().getCurrentPosition(...args);
  }

  watchPosition(...args: WatchPositionParameters): number {
    const delegate = this.#delegate();
    const delegateWatchId = delegate.watchPosition(...args);

    const watchId = this.#watchId++;
    this.watches[watchId] = { args, delegate, delegateWatchId };

    this.#subscribe(this.#handleDelegateChange);

    return watchId;
  }

  clearWatch(watchId: number): void {
    const watch = this.watches[watchId];
    if (!watch) return;

    const { delegate, delegateWatchId } = watch;
    delegate.clearWatch(delegateWatchId);
    delete this.watches[watchId];

    if (Object.keys(this.watches).length < 1) {
      this.#unsubscribe(this.#handleDelegateChange);
    }
  }

  readonly #delegate: () => StdGeolocation;
  readonly #subscribe: (subscriber: Subscriber) => void;
  readonly #unsubscribe: (subscriber: Subscriber) => void;
  #watchId: number;
  readonly watches: Record<number, Watch> = {};
  readonly #handleDelegateChange: () => void;
}

Geolocation satisfies new (...args: never[]) => StdGeolocation;

type Subscriber = () => void;

type Watch = {
  readonly args: WatchPositionParameters;
  delegate: StdGeolocation;
  delegateWatchId: number;
};

type GetCurrentPositionParameters = Parameters<
  StdGeolocation["getCurrentPosition"]
>;
type WatchPositionParameters = Parameters<StdGeolocation["watchPosition"]>;
