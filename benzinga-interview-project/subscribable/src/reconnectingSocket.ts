import SubscribableSocket, { SubscribableSocketEvent } from './socket';
import { ExtendedSubscribable, SubscribableEvent, Subscription } from './subscribable';
import SubscribableSleepWakeUp from './wakeUp';
interface SocketDisconnectEvent extends SubscribableEvent<'disconnected' | 'reconnecting'> {
  errorEvent: CloseEvent;
}

export type SubscribableReconnectingSocketEvent<RESPFormat> =
  | SocketDisconnectEvent
  | SubscribableEvent<'reconnected'>
  | SubscribableSocketEvent<RESPFormat>;

interface ReconnectingSocketFunctions {
  close: SubscribableReconnectingSocket['close'];
  open: SubscribableReconnectingSocket['open'];
  reconnect: SubscribableReconnectingSocket['reconnect'];
  send: SubscribableReconnectingSocket['send'];
  sendObject: SubscribableReconnectingSocket['sendObject'];
}

class SubscribableReconnectingSocket<RESPFormat = unknown, REQFormat = unknown> extends ExtendedSubscribable<
  SubscribableReconnectingSocketEvent<RESPFormat>,
  ReconnectingSocketFunctions
> {
  private socket: SubscribableSocket<RESPFormat, REQFormat>;
  private socketSubscription?: Subscription<SubscribableSocket<RESPFormat>>;
  private sleepWakeUp: SubscribableSleepWakeUp;
  private sleepWakeUpSubscription?: Subscription<SubscribableSleepWakeUp>;
  private disconnectTime?: Date;
  private getTimeoutLength?: (disconnectTime: Date) => number;

  constructor(url: URL, getTimeoutLength?: (disconnectTime: Date) => number) {
    super();
    this.socket = new SubscribableSocket(url);
    this.sleepWakeUp = new SubscribableSleepWakeUp();
    this.disconnectTime = undefined;
    this.getTimeoutLength = getTimeoutLength;
  }

  private static getTimeoutLength = (disconnectTime: Date): number => {
    const timeDelta = new Date().getTime() - disconnectTime.getTime();
    if (timeDelta > 10000) {
      return 10000;
    } else if (timeDelta < 100) {
      return 100;
    } else {
      return timeDelta;
    }
  };

  public open = (): void => {
    this.disconnectTime = undefined;
    this.socketSubscription = this.socket.subscribe(this.onMessage);
    this.socket.close();
    this.socket.open();
    this.sleepWakeUpSubscription = this.sleepWakeUp.subscribe(() => this.reconnect());
  };

  public reconnect = (): void => {
    this.socket.close();
    this.socket.open();
  };

  public send = (data: string | ArrayBuffer | ArrayBufferView | Blob): void => {
    this.socket.send(data);
  };

  public sendObject = <T = REQFormat>(data: T): void => {
    this.socket.sendObject(data);
  };

  public close = (): void => {
    this.socket.close();
    this.sleepWakeUpSubscription?.unsubscribe();
    this.sleepWakeUpSubscription = undefined;
  };

  protected onSubscribe = (): ReconnectingSocketFunctions => ({
    close: this.close,
    open: this.open,
    reconnect: this.reconnect,
    send: this.send,
    sendObject: this.sendObject,
  });

  protected onZeroSubscriptions = (): void => this.close();

  private onMessage = (event: SubscribableSocketEvent<RESPFormat>) => {
    switch (event.type) {
      case 'close':
        if (event.event.wasClean) {
          this.call(event);
          this.socketSubscription?.unsubscribe();
        } else {
          if (this.disconnectTime === undefined) {
            this.call({ errorEvent: event.event, type: 'disconnected' });
          }
          this.call({ errorEvent: event.event, type: 'reconnecting' });
          this.timedReconnect();
        }
        break;
      case 'open':
        if (this.disconnectTime) {
          this.disconnectTime = undefined;
          this.call({ type: 'reconnected' });
        } else {
          this.call(event);
        }
        break;
      default:
        this.call(event);
        break;
    }
  };

  private timedReconnect = () => {
    this.socket.close();
    if (this.disconnectTime === undefined) {
      this.disconnectTime = new Date();
    }
    const getTimeoutLength = this.getTimeoutLength ?? SubscribableReconnectingSocket.getTimeoutLength;

    setTimeout(() => {
      this.socket.open();
    }, getTimeoutLength(this.disconnectTime));
  };
}

export default SubscribableReconnectingSocket;
