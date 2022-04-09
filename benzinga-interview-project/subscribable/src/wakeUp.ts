import { Subscribable } from './subscribable';
import workerify from './workerify';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import DetectWakeup from './DetectWakeup.worker.js';

let myWorker: Worker | undefined = undefined;
const reconnectArray = new Set<SubscribableSleepWakeUp>();

if (typeof window === 'object' && window.Worker && myWorker === undefined) {
  myWorker = workerify(DetectWakeup);
  myWorker.onmessage = (event: MessageEvent<'wake_up'>) => {
    if (event) {
      reconnectArray.forEach(item => item.reconnect());
    }
  };
}

type WakeUpEvent = {
  type: 'wake_up';
};

export type SubscribableSleepWakeUpEvent = WakeUpEvent;

class SubscribableSleepWakeUp extends Subscribable<SubscribableSleepWakeUpEvent> {
  public reconnect = (): void => {
    this.call({ type: 'wake_up' });
  };

  protected onFirstSubscription = (): void => {
    reconnectArray.add(this);
  };

  protected onZeroSubscriptions = (): void => {
    reconnectArray.delete(this);
  };
}

export default SubscribableSleepWakeUp;
