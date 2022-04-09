import { Subscribable, Subscription, SubscribableEvent } from './subscribable';

type SubscriberUniqueId = unknown;

export class SubscribableMultiplexer<Events extends SubscribableEvent<string>> extends Subscribable<Events> {
  private subscribables: Map<SubscriberUniqueId, Subscribable<Events>>;
  private subscriptions?: Map<SubscriberUniqueId, Subscription<Subscribable<Events>>>;

  constructor(subscribables: [SubscriberUniqueId, Subscribable<Events>][]) {
    super();
    this.subscribables = new Map(subscribables);
  }

  public add = (id: SubscriberUniqueId, subscribable: Subscribable<Events>): void => {
    if (this.subscriptions) {
      const subFound = this.subscriptions.get(id);
      if (subFound) {
        subFound.unsubscribe();
      }
      this.subscriptions.set(
        id,
        subscribable.subscribe(event => this.call(event)),
      );
    }
    this.subscribables.set(id, subscribable);
  };

  public remove = (id: SubscriberUniqueId): void => {
    if (this.subscriptions) {
      const subFound = this.subscriptions.get(id);
      if (subFound) {
        subFound.unsubscribe();
      }
      this.subscriptions.delete(id);
    }
    this.subscribables.delete(id);
  };

  public get = (id: SubscriberUniqueId): Subscribable<Events> | undefined => this.subscribables.get(id);

  protected onFirstSubscription = (): void => {
    const subscriptions: [SubscriberUniqueId, Subscription<Subscribable<Events>>][] = [];
    this.subscribables.forEach((val, key) => subscriptions.push([key, val.subscribe(event => this.call(event))]));
    this.subscriptions = new Map(subscriptions);
  };

  protected onZeroSubscriptions = (): void => {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
    this.subscriptions = undefined;
  };
}
