import { Subscribable } from '@benzinga/subscribable';
import { LinkListBuffer, Container, ContainerEvent } from '../../utils';
import { Signal } from './entities';
import { SignalFeedEvent } from './signalFeed';

export type SignalContainerEvent = ContainerEvent<Signal>;
export class SignalContainer extends Container<Signal, SignalFeedEvent, LinkListBuffer<Signal>> {
  constructor(signalSocket: Subscribable<SignalFeedEvent>, MaxQueueSize = 10000) {
    super(signalSocket, MaxQueueSize, new LinkListBuffer<Signal>(), new LinkListBuffer<Signal>());
  }

  protected onMessage = (event: SignalFeedEvent): void => {
    switch (event.type) {
      case 'signal':
        this.push(event.signal);
        break;
      case 'feed':
        this.clear();
        break;
      case 'status':
        if (event.status === 'reconnected') {
          this.clear();
        }
        break;
    }
  };
}
