export interface SubscribableEvent<EventType extends string> {
  type: EventType;
}

interface SubscriptionType<Events extends SubscribableEvent<string>> {
  unsubscribe: () => void;
  update: (callback: (event: Events) => void) => void;
}

type SubscriptionExtendedType<
  Events extends SubscribableEvent<string>,
  Extension extends Record<keyof Extension, unknown> | undefined = undefined
> = Extension extends undefined ? SubscriptionType<Events> : SubscriptionType<Events> & Extension;

export type Subscription<
  T extends { subscribe: (callback: (event: unknown) => void, ...args: readonly unknown[]) => unknown }
> = ReturnType<T['subscribe']>;

export type SubscriberId = number;

interface subscriber<Events> {
  callback: (event: Events) => void;
  id: SubscriberId;
}

// This is an inheritable class that makes the inheriting class subscribable.
export abstract class Subscribable<
  Events extends SubscribableEvent<string>,
  SubscriberArgs extends readonly unknown[] = readonly unknown[]
> {
  private subscribers: Map<SubscriberId, subscriber<Events>>;
  constructor() {
    this.subscribers = new Map<SubscriberId, subscriber<Events>>();
  }

  public subscribe = (callback: (event: Events) => void, ...args: SubscriberArgs): SubscriptionType<Events> => {
    const [id, base] = this._baseSubscribe(callback);
    this.onSubscribe(id, ...args);
    return base;
  };

  protected _baseSubscribe = (callback: (event: Events) => void): [SubscriberId, SubscriptionType<Events>] => {
    const subscriber = {
      callback,
      id: Date.now() + Math.random(),
    };
    while (this.subscribers.has(subscriber.id)) {
      subscriber.id = Date.now() + Math.random();
    }
    this.subscribers.set(subscriber.id, subscriber);
    console.debug({ id: subscriber.id, subName: this.constructor.name, subscriptionEvent: 'subscribe' });
    if (this.subscribers.size === 1) {
      this.onFirstSubscription();
    }
    return [
      subscriber.id,
      {
        unsubscribe: () => {
          this.unsubscribe(subscriber.id);
        },
        update: (callback: (event: Events) => void) => {
          this.subscribers.set(subscriber.id, {
            callback,
            id: subscriber.id,
          });
        },
      },
    ];
  };

  protected onFirstSubscription = (): void => undefined;
  protected onZeroSubscriptions = (): void => undefined;
  protected onSubscribe(_id: SubscriberId, ..._args: SubscriberArgs): void {
    return undefined;
  }
  protected onUnsubscribe = (_id: SubscriberId): void => undefined;

  protected call = (event: Events, subscriberIds?: SubscriberId[]): void => {
    console.debug({ ...event, subName: this.constructor.name, subscriptionEvent: 'call' });
    // find all subscribers that wish to be notified and notify them
    if (subscriberIds) {
      subscriberIds.forEach(subscriberId => this.subscribers.get(subscriberId)?.callback(event));
    } else {
      this.subscribers.forEach(value => value.callback(event));
    }
  };

  private unsubscribe = (id: number): void => {
    console.debug({ id, subName: this.constructor.name, subscriptionEvent: 'unsubscribe' });
    this.subscribers.delete(id);
    this.onUnsubscribe(id);
    if (this.subscribers.size === 0) {
      this.onZeroSubscriptions();
    }
  };
}

export abstract class ExtendedSubscribable<
  Events extends SubscribableEvent<string>,
  Extension extends Record<keyof Extension, unknown>,
  SubscriberArgs extends readonly unknown[] = readonly unknown[]
> extends Subscribable<Events, SubscriberArgs> {
  public subscribe = (
    callback: (event: Events) => void,
    ...args: SubscriberArgs
  ): SubscriptionExtendedType<Events, Extension> => {
    const [id, base] = this._baseSubscribe(callback);
    const extend = this.onSubscribe(id, ...args);
    return { ...base, ...extend } as SubscriptionExtendedType<Events, Extension>;
  };

  protected abstract onSubscribe(_id: SubscriberId, ..._args: SubscriberArgs): Extension;
}
