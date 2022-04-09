import { SafePromise, safeThen } from '@benzinga/safe-await';

import { RestfulClient } from '../../utils';
import { StockSymbol } from '../../entities';
import { Watchlist, WatchlistSymbol } from './entities';
import { IncomingWatchlistResult, IncomingWatchlistSymbolResult } from './ingest';
import { SessionManager } from '../session';

export class WatchlistRestful extends RestfulClient {
  constructor(hostname: URL, session: SessionManager) {
    super(hostname, session, { 'x-device-key': true });
  }

  getWatchlist = (): SafePromise<IncomingWatchlistResult> => {
    const url = this.URL('services/watchlist/bzuser/portfolio');
    return this.debouncedGet(url, { credentials: 'same-origin' });
  };

  createWatchlist = (name: string): SafePromise<IncomingWatchlistResult> => {
    const url = this.URL('services/watchlist/bzuser/portfolio');
    return this.post(
      url,
      {
        alerts: [],
        portfolio_name: name,
        send_summary: false,
        status: true,
      },
      { credentials: 'same-origin' },
    );
  };

  addTickerToWatchlist = (watchlist: Watchlist, ticker: StockSymbol): SafePromise<IncomingWatchlistSymbolResult> => {
    const url = this.URL('services/watchlist/bzuser/alert/');
    return this.post(
      url,
      {
        alert_name: ticker,
        portfolio_id: watchlist.watchlistId,
        status: true,
        type: 'ticker',
      },
      { credentials: 'same-origin' },
    );
  };

  removeTickerFromWatchlist = async (watchlist: Watchlist, alert: WatchlistSymbol): SafePromise<undefined> => {
    const url = this.URL(`services/watchlist/bzuser/alert/${alert.symbolId}`, {
      portfolio_id: watchlist.watchlistId,
    });
    return safeThen(this.delete(url, { credentials: 'same-origin' }), () => ({ result: undefined }));
  };

  removeWatchlist = async (watchlist: Watchlist): SafePromise<undefined> => {
    const url = this.URL(`services/watchlist/bzuser/portfolio/${watchlist.watchlistId}`);
    return safeThen(this.delete(url, { credentials: 'same-origin' }), () => ({ result: undefined }));
  };
}
