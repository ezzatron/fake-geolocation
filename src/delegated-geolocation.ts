let canConstruct = false;

export function createDelegatedGeolocation({
  delegates,
}: {
  delegates: globalThis.Geolocation[];
}): {
  geolocation: globalThis.Geolocation;
  selectDelegate: SelectDelegate;
  isDelegateSelected: IsDelegateSelected;
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

    isDelegateSelected(query) {
      return query === delegate;
    },
  };
}

export type SelectDelegate = (delegate: globalThis.Geolocation) => void;
export type IsDelegateSelected = (delegate: globalThis.Geolocation) => boolean;

type GeolocationParameters = {
  delegate: () => globalThis.Geolocation;
  subscribe: (subscriber: Subscriber) => void;
  unsubscribe: (subscriber: Subscriber) => void;
};

export class Geolocation {
  /**
   * @deprecated Use the `createDelegatedGeolocation()` function instead.
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

  readonly #delegate: () => globalThis.Geolocation;
  readonly #subscribe: (subscriber: Subscriber) => void;
  readonly #unsubscribe: (subscriber: Subscriber) => void;
  #watchId: number;
  readonly watches: Record<number, Watch> = {};
  readonly #handleDelegateChange: () => void;
}

type Subscriber = () => void;

type Watch = {
  readonly args: WatchPositionParameters;
  delegate: globalThis.Geolocation;
  delegateWatchId: number;
};

type GetCurrentPositionParameters = Parameters<
  globalThis.Geolocation["getCurrentPosition"]
>;
type WatchPositionParameters = Parameters<
  globalThis.Geolocation["watchPosition"]
>;
