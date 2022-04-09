import { Subscribable, Subscription } from '@benzinga/subscribable';
import { QuoteSocket, QuoteSocketEvent } from './socket';
import { IncomingQuote, QuoteDetail, Security } from './entities';

interface QuoteEvent {
  quote: IncomingQuote;
  type: 'quote';
}

export interface InitialQuoteEvent {
  detail: QuoteDetail;
  quote: IncomingQuote;
  type: 'initial_quote';
}

export type QuoteSessionEvents = QuoteEvent | InitialQuoteEvent;
export class QuoteSession extends Subscribable<QuoteSessionEvents> {
  private socket: QuoteSocket;
  private security: Security;
  private socketSubscription?: Subscription<QuoteSocket>;

  constructor(quoteSocket: QuoteSocket, security: Security) {
    super();
    this.socket = quoteSocket;
    this.security = security;
  }

  public getSecurity = (): Security => this.security;

  protected onFirstSubscription = (): void => {
    this.socketSubscription = this.socket.subscribe(this.socketCallback);
    this.socket.startSession(this);
  };

  protected onZeroSubscriptions = (): void => {
    this.socket.endSession(this);
    this.socketSubscription?.unsubscribe();
    this.socketSubscription = undefined;
  };

  private socketCallback = (event: QuoteSocketEvent): void => {
    switch (event.type) {
      case 'initial_quote':
      case 'quote':
        if (event.quote.symbol === this.security) {
          this.call(event);
        }
        break;
    }
  };
}
