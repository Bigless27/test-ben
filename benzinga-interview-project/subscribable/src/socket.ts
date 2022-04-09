import { ExtendedSubscribable, SubscribableEvent } from './subscribable';

interface SocketRequestEvent extends SubscribableEvent<'request'> {
  msg: string | ArrayBuffer | ArrayBufferView | Blob;
}

interface SocketResponseEvent<T> extends SubscribableEvent<'response'> {
  msg: T;
}

interface SocketErrorEvent extends SubscribableEvent<'error'> {
  errorEvent: Event;
}

interface SocketCloseEvent extends SubscribableEvent<'close'> {
  event: CloseEvent;
}

export type SubscribableSocketEvent<RESPFormat> =
  | SocketCloseEvent
  | SocketErrorEvent
  | SocketRequestEvent
  | SocketResponseEvent<RESPFormat>
  | SubscribableEvent<'open'>;

type SocketState = 'closed' | 'open' | 'opening';

interface SocketFunctions {
  close: SubscribableSocket['close'];
  open: SubscribableSocket['open'];
  send: SubscribableSocket['send'];
  sendObject: SubscribableSocket['sendObject'];
}

class SubscribableSocket<RESPFormat = unknown, REQFormat = unknown> extends ExtendedSubscribable<
  SubscribableSocketEvent<RESPFormat>,
  SocketFunctions
> {
  private socket?: WebSocket;
  private url: URL;
  private state: SocketState;
  private queueSend: (string | ArrayBuffer | ArrayBufferView | Blob)[] = [];

  constructor(url: URL) {
    super();
    this.url = url;
    this.state = 'closed';
  }

  public open = (): void => {
    if (this.socket === undefined) {
      this.state = 'opening';
      this.socket = new WebSocket(this.url.toString());
      this.socket.onopen = () => {
        this.call({ type: 'open' });
        this.state = 'open';
        this.queueSend.forEach(data => this.send(data));
        this.queueSend = [];
      };
      this.socket.onmessage = (event: MessageEvent) => {
        this.call({ msg: event.data, type: 'response' });
      };
      this.socket.onerror = (event: Event) => {
        this.call({ errorEvent: event, type: 'error' });
      };
      this.socket.onclose = (event: CloseEvent) => {
        this.call({ event: event, type: 'close' });
      };
    }
  };

  public close = (): void => {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    this.state = 'closed';
  };

  public sendObject = <T = REQFormat>(data: T): void => {
    this.send(JSON.stringify(data));
  };

  public send = (data: string | ArrayBuffer | ArrayBufferView | Blob): void => {
    switch (this.state) {
      case 'opening':
        this.queueSend.push(data);
        break;
      case 'open':
        this.socket?.send(data);
        this.call({ msg: data, type: 'request' });
        break;
      case 'closed':
        console.log('cannot send data if socket is not open');
        break;
    }
  };

  protected onSubscribe = (): SocketFunctions => ({
    close: this.close,
    open: this.open,
    send: this.send,
    sendObject: this.sendObject,
  });

  protected onZeroSubscriptions = (): void => {
    this.close();
  };
}

export default SubscribableSocket;
