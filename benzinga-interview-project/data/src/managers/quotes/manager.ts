import { Subscribable, Subscription } from '@benzinga/subscribable';
import { Quote, Security } from './entities';
import { QuoteSocketEvent, QuoteSocket } from './socket';
import { QuoteFeedEvent, QuoteFeed } from './feed';
import { QuoteStore } from './store';
import { SessionManager } from '../session';

export type QuotesManagerEvent = QuoteSocketEvent | QuoteFeedEvent;
export class QuotesManager extends Subscribable<QuotesManagerEvent> {
  private socket: QuoteSocket;
  private socketSubscription?: Subscription<QuoteSocket>;
  private store: QuoteStore;

  constructor(_restfulURL: URL, socketUrl: URL, session: SessionManager) {
    super();
    this.socket = new QuoteSocket(socketUrl, session);
    this.store = new QuoteStore();
  }

  public getQuoteValue = (security: Security): Quote | undefined => {
    const quoteFeed = this.store.getQuoteFeed(security);
    if (quoteFeed) {
      return quoteFeed.getQuote();
    } else {
      return undefined;
    }
  };

  public createQuoteFeed = (security: Security): QuoteFeed => {
    const quoteFeed = this.store.getQuoteFeed(security);
    if (quoteFeed) {
      return quoteFeed;
    } else {
      return this.store.addQuoteFeed(new QuoteFeed(this.socket.createSession(security)));
    }
  };

  protected onFirstSubscription = (): void => {
    this.socketSubscription = this.socket.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.socketSubscription?.unsubscribe();
  };
}
