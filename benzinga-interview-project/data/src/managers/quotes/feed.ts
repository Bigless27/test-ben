import { Subscribable, Subscription } from '@benzinga/subscribable';
import { QuoteSession, QuoteSessionEvents } from './session';
import { Quote, QuoteDetail, Security } from './entities';

interface QuoteEvent {
  quote: Quote;
  type: 'quote';
}

export type QuoteFeedEvent = QuoteEvent;
export class QuoteFeed extends Subscribable<QuoteFeedEvent> {
  private sessions: QuoteSession;
  private sessionsSubscription?: Subscription<QuoteSession>;
  private detail?: QuoteDetail;
  private quote?: Quote;

  constructor(sessions: QuoteSession) {
    super();
    this.sessions = sessions;
  }

  public getSecurities = (): Security => this.sessions.getSecurity();
  public getDetail = (): QuoteDetail | undefined => this.detail;
  public getQuote = (): Quote | undefined => this.quote;

  protected onFirstSubscription = (): void => {
    this.sessionsSubscription = this.sessions.subscribe(this.socketCallback);
  };

  protected onZeroSubscriptions = (): void => {
    this.sessionsSubscription?.unsubscribe();
  };

  private socketCallback = (event: QuoteSessionEvents): void => {
    switch (event.type) {
      case 'initial_quote':
        this.detail = event.detail;
      // fall through
      case 'quote':
        this.quote = event.quote;
        this.call({ quote: event.quote, type: 'quote' });
        break;
    }
  };
}
