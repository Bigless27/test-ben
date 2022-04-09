import { Subscription, SubscribableEvent } from '@benzinga/subscribable';

export interface Manager<T extends SubscribableEvent<string>> {
  subscribe: (callback: (event: T) => void, ..._args: readonly unknown[]) => Subscription<T>;
}
