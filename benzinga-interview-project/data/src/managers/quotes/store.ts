import { QuoteFeed } from './feed';
import { Security } from './entities';

export class QuoteStore {
  private quoteFeeds = new Map<Security, QuoteFeed>();

  public addQuoteFeed = (quoteFeed: QuoteFeed): QuoteFeed => {
    this.quoteFeeds.set(quoteFeed.getSecurities(), quoteFeed);
    return quoteFeed;
  };

  public removeQuoteFeed = (security: Security): void => {
    this.quoteFeeds.delete(security);
  };

  public getQuoteFeeds = (): QuoteFeed[] => {
    return Array.from(this.quoteFeeds.values());
  };

  public hasQuoteFeed = (security: Security): boolean => {
    return this.quoteFeeds.has(security);
  };

  public getQuoteFeed = (security: Security): QuoteFeed | undefined => {
    return this.quoteFeeds.get(security);
  };
}
