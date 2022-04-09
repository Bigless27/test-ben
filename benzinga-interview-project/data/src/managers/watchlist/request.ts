import { SafeError, SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable } from '@benzinga/subscribable';

import { StockSymbol } from '../../entities';
import { Watchlist, WatchlistSymbol } from './entities';
import { WatchlistRestful } from './restful';
import { ingestSymbols, ingestWatchlist } from './ingest';
import { SessionManager } from '../session';

interface ErrorEvent {
  error?: SafeError;
  errorType:
    | 'get_watchlist_error'
    | 'create_watchlist_error'
    | 'add_ticker_to_watchlist_error'
    | 'remove_watchlist_ticker_error'
    | 'remove_watchlist_error'
    | 'watchlist_verification_error';
  type: 'error';
}

interface WatchlistEvent {
  type: 'watchlist_create' | 'watchlist_remove';
  watchlist: Watchlist;
}

interface WatchlistUpdateEvent {
  type: 'watchlist_received';
  watchlist: Watchlist[];
}

interface WatchlistTickerAddEvent {
  symbol: StockSymbol;
  type: 'watchlist_add_ticker';
  watchlist: Watchlist;
}

interface WatchlistTickerRemoveEvent {
  symbol: WatchlistSymbol;
  type: 'watchlist_remove_ticker';
  watchlist: Watchlist;
}

export type WatchlistRequestEvent =
  | ErrorEvent
  | WatchlistEvent
  | WatchlistUpdateEvent
  | WatchlistTickerAddEvent
  | WatchlistTickerRemoveEvent;

interface WatchlistFunctions {
  addTickerToWatchlist: WatchlistRequest['addTickerToWatchlist'];
  createWatchlist: WatchlistRequest['createWatchlist'];
  getWatchlist: WatchlistRequest['getWatchlist'];
  removeTickerFromWatchlist: WatchlistRequest['removeTickerFromWatchlist'];
  removeWatchlist: WatchlistRequest['removeWatchlist'];
}

export class WatchlistRequest extends ExtendedSubscribable<WatchlistRequestEvent, WatchlistFunctions> {
  private restful: WatchlistRestful;

  constructor(url: URL, session: SessionManager) {
    super();
    this.restful = new WatchlistRestful(url, session);
  }

  public getWatchlist = async (): SafePromise<Watchlist[]> => {
    const watchlists = await ingestWatchlist(this.restful.getWatchlist());
    if (watchlists.err) {
      this.call({
        error: watchlists.err,
        errorType: 'get_watchlist_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'watchlist_received',
        watchlist: watchlists.result,
      });
    }
    return watchlists;
  };

  public createWatchlist = async (watchlistName: string): SafePromise<Watchlist> => {
    const watchlists = await ingestWatchlist(this.restful.createWatchlist(watchlistName));
    if (watchlists.err) {
      this.call({
        error: watchlists.err,
        errorType: 'create_watchlist_error',
        type: 'error',
      });
    } else {
      if (watchlists.result.length === 1) {
        this.call({
          type: 'watchlist_create',
          watchlist: watchlists.result[0],
        });
        return { result: watchlists.result[0] };
      } else {
        const error = new SafeError(
          'more then one watchlist returned on create',
          'invalid_create_watchlist',
          watchlists,
        );
        this.call({
          error: error,
          errorType: 'create_watchlist_error',
          type: 'error',
        });
        return { err: error };
      }
    }
    return watchlists;
  };

  public addTickerToWatchlist = async (watchlist: Watchlist, ticker: StockSymbol): SafePromise<Watchlist> => {
    const watchlistSymbol = await ingestSymbols(this.restful.addTickerToWatchlist(watchlist, ticker));
    if (watchlistSymbol.err) {
      this.call({
        error: watchlistSymbol.err,
        errorType: 'add_ticker_to_watchlist_error',
        type: 'error',
      });
      return watchlistSymbol;
    } else {
      watchlist.symbols = [...watchlist.symbols, ...watchlistSymbol.result];
      this.call({
        symbol: ticker,
        type: 'watchlist_add_ticker',
        watchlist,
      });
      return { result: watchlist };
    }
  };

  public removeTickerFromWatchlist = async (watchlist: Watchlist, ticker: WatchlistSymbol): SafePromise<Watchlist> => {
    const { err } = await this.restful.removeTickerFromWatchlist(watchlist, ticker);
    if (err) {
      this.call({
        error: err,
        errorType: 'remove_watchlist_ticker_error',
        type: 'error',
      });
      return { err };
    } else {
      watchlist.symbols = watchlist.symbols.filter(symbol => ticker.symbolId !== symbol.symbolId);
      this.call({
        symbol: ticker,
        type: 'watchlist_remove_ticker',
        watchlist,
      });
      return { result: watchlist };
    }
  };

  public removeWatchlist = async (watchlist: Watchlist): SafePromise<undefined> => {
    const removed = await this.restful.removeWatchlist(watchlist);
    if (removed.err) {
      this.call({
        error: removed.err,
        errorType: 'remove_watchlist_error',
        type: 'error',
      });
    } else {
      this.call({
        type: 'watchlist_remove',
        watchlist,
      });
    }
    return removed;
  };

  protected onSubscribe = (): WatchlistFunctions => ({
    addTickerToWatchlist: this.addTickerToWatchlist,
    createWatchlist: this.createWatchlist,
    getWatchlist: this.getWatchlist,
    removeTickerFromWatchlist: this.removeTickerFromWatchlist,
    removeWatchlist: this.removeWatchlist,
  });
}
