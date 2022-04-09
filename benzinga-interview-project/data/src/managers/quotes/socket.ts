import {
  Subscribable,
  SubscribableReconnectingSocket,
  SubscribableReconnectingSocketEvent,
  Subscription,
} from '@benzinga/subscribable';
import { SessionManager } from '../session';

import { InitialQuote, IncomingQuote, QuoteDetail, Security } from './entities';
import { QuoteSession } from './session';

export interface NewQuoteEvent {
  quote: IncomingQuote;
  type: 'quote';
}

export interface InitialQuoteEvent {
  detail: QuoteDetail;
  quote: IncomingQuote;
  type: 'initial_quote';
}

export interface QuoteSocketErrorEvent {
  Error: '';
  type: 'error';
}

export type QuoteSocketEvent = NewQuoteEvent | InitialQuoteEvent | QuoteSocketErrorEvent;

export class QuoteSocket extends Subscribable<QuoteSocketEvent> {
  private socket: SubscribableReconnectingSocket<string>;
  private socketSubscription?: Subscription<SubscribableReconnectingSocket<string>>;
  private isAuthorized = false;
  private session: SessionManager;
  private securityQueue: Security[] = [];

  constructor(socketUrl: URL, session: SessionManager) {
    super();
    this.socket = new SubscribableReconnectingSocket(socketUrl);
    this.session = session;
  }

  public createSession = (securities: Security): QuoteSession => {
    return new QuoteSession(this, securities);
  };

  public authorizeSession = (): void => {
    const authKey = this.session.getManager('authentication').getBenzingaToken() ?? '';
    this.socket.sendObject<Request>({
      data: [{ authKey }],
      name: 'auth',
      type: 1,
    });
  };

  public startSession = (session: QuoteSession): void => {
    const security = session.getSecurity();
    if (!this.isAuthorized) {
      this.securityQueue.push(security);
    } else {
      this.joinSecurities([security]);
    }
  };

  public endSession = (session: QuoteSession): void => {
    const security = session.getSecurity();

    this.socket.sendObject<Request>({
      ack: 0,
      data: [[security]],
      name: 'leave',
      type: 1,
    });
  };

  protected onFirstSubscription = (): void => this.open();
  protected onZeroSubscriptions = (): void => this.stop();

  private joinSecurities = (securities: Security[]): void => {
    if (securities?.length) {
      this.socket.sendObject<Request>({
        ack: 0,
        data: [securities],
        name: 'join',
        type: 1,
      });
    }
  };

  private stop = (): void => {
    this.socket.close();
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = undefined;
  };

  private open = (): void => {
    if (this.socketSubscription === undefined) {
      this.socketSubscription = this.socket.subscribe(this.onMessage);
    }
    this.socket.open();
  };

  private onMessage = (event: SubscribableReconnectingSocketEvent<string>): void => {
    switch (event.type) {
      case 'response': {
        const msg: Response = JSON.parse(event.msg);
        switch (msg.type) {
          case 3:
            this.socket.sendObject<Request>({ type: 4 });
            break;
          case 1:
            switch (msg.name) {
              case 'initialQuote':
                (msg.data ?? []).forEach(quote => {
                  if (quote.quote) {
                    this.call({
                      detail: quote.detail,
                      quote: quote.quote,
                      type: 'initial_quote',
                    });
                  }
                });
                break;
              case 'quote':
                (msg.data ?? []).forEach(quote => {
                  this.call({ quote: quote, type: 'quote' });
                });
                break;
              case 'connected':
                this.authorizeSession();
                break;
              case 'auth':
                this.isAuthorized = true;
                this.joinSecurities(this.securityQueue);
                this.securityQueue = [];
                break;
            }
            break;
        }
        break;
      }
    }
  };
}

interface JoinLeaveRequest {
  ack: 0;
  data: Security[][];
  name: 'join' | 'leave';
  type: 1;
}

interface AuthRequest {
  data: { authKey: string }[];
  name: 'auth';
  type: 1;
}

interface PongRequest {
  type: 4;
}

type Request = PongRequest | JoinLeaveRequest | AuthRequest;

interface InitialQuoteResponse {
  data: InitialQuote[];
  name: 'initialQuote';
  type: 1;
}

interface QuoteResponse {
  data: IncomingQuote[];
  name: 'quote';
  type: 1;
}

interface AuthResponse {
  name: 'auth';
  type: 1;
}

interface ConnectedResponse {
  name: 'connected';
  type: 1;
}

interface PingResponse {
  type: 3;
}

type Response = PingResponse | InitialQuoteResponse | QuoteResponse | AuthResponse | ConnectedResponse;
