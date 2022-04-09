import { SafeError, SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable, Subscription } from '@benzinga/subscribable';

import { StockSymbol } from '../../entities';
import { SessionManager } from '../session';
import { Watchlist, WatchlistSymbol } from './entities';
import { WatchlistRequest, WatchlistRequestEvent } from './request';
import { WatchlistStore } from './store';

interface WatchlistFunctions {
  addTickerToWatchlist: WatchlistManager['addTickerToWatchlist'];
  createWatchlist: WatchlistManager['createWatchlist'];
  getWatchlist: WatchlistManager['getWatchlist'];
  removeTickerFromWatchlist: WatchlistManager['removeTickerFromWatchlist'];
  removeWatchlist: WatchlistManager['removeWatchlist'];
}

interface WatchlistUpdateEvent {
  type: 'watchlist_update';
  watchlist: Watchlist[];
}

export type WatchlistManagerEvent = WatchlistRequestEvent | WatchlistUpdateEvent;

export class WatchlistManager extends ExtendedSubscribable<WatchlistManagerEvent, WatchlistFunctions> {
  private store: WatchlistStore;
  private request: WatchlistRequest;
  private requestSubscription?: Subscription<WatchlistRequest>;

  constructor(url: URL, session: SessionManager) {
    super();
    this.request = new WatchlistRequest(url, session);
    this.store = new WatchlistStore();
  }

  public static compareWatchlists = (lhs: Watchlist[], rhs: Watchlist[]): boolean => {
    return lhs?.every(watchlist => {
      const newWatchlist = rhs.find(newWatchlist => watchlist.watchlistId === newWatchlist.watchlistId);
      if (newWatchlist) {
        return watchlist.symbols.every(symbol =>
          newWatchlist.symbols.some(newSymbol => symbol.symbolId === newSymbol.symbolId),
        );
      } else {
        return false;
      }
    });
  };

  // avoid using this.
  public getStoredWatchlist = (): Watchlist[] => {
    return this.store.getWatchlists() ?? [];
  };

  public getWatchlist = async (force?: boolean): SafePromise<Watchlist[] | undefined> => {
    if (force || this.store.shouldWeFetchWatchlist() === true) {
      const watchlists = await this.request.getWatchlist();
      if (watchlists.err) {
        return watchlists;
      } else {
        if (this.store.updateWatchlists(watchlists.result)) {
          this.call({
            type: 'watchlist_update',
            watchlist: watchlists.result,
          });
        }
      }
      return watchlists;
    } else {
      return { result: this.store.getWatchlists() };
    }
  };

  public createWatchlist = async (watchlistName: string): SafePromise<Watchlist> => {
    if (this.store.shouldWeFetchWatchlist() === true) {
      await this.getWatchlist();
    }
    const watchlist = await this.request.createWatchlist(watchlistName);
    if (watchlist.err) {
      return watchlist;
    } else {
      this.store.addWatchlist(watchlist.result);
      this.call({
        type: 'watchlist_update',
        watchlist: this.store.getWatchlists() ?? [],
      });
      return watchlist;
    }
  };

  public addTickerToWatchlist = async (watchlist: Watchlist, ticker: StockSymbol): SafePromise<Watchlist> => {
    const myWatchlist = await this.verifyWatchlist(watchlist, 'add_ticker_to_watchlist_error');
    if (myWatchlist.err) {
      return myWatchlist;
    }

    if (this.store.getWatchlists() === undefined) {
      await this.getWatchlist();
    }

    const updatedWatchlist = await this.request.addTickerToWatchlist(myWatchlist.result, ticker);
    if (updatedWatchlist.err) {
      return updatedWatchlist;
    } else {
      this.store.updateWatchlist(updatedWatchlist.result);
      this.call({
        type: 'watchlist_update',
        watchlist: this.store.getWatchlists() ?? [],
      });
    }
    return updatedWatchlist;
  };

  public removeTickerFromWatchlist = async (watchlist: Watchlist, ticker: WatchlistSymbol): SafePromise<Watchlist> => {
    const myWatchlist = await this.verifyWatchlist(watchlist, 'remove_watchlist_ticker_error');
    if (myWatchlist.err) {
      return myWatchlist;
    }

    if (this.store.getWatchlists() === undefined) {
      await this.getWatchlist();
    }

    const updatedWatchlist = await this.request.removeTickerFromWatchlist(myWatchlist.result, ticker);
    if (updatedWatchlist.err) {
      return updatedWatchlist;
    } else {
      this.store.updateWatchlist(updatedWatchlist.result);
      this.call({
        type: 'watchlist_update',
        watchlist: this.store.getWatchlists() ?? [],
      });
    }
    return updatedWatchlist;
  };

  public removeWatchlist = async (watchlist: Watchlist): SafePromise<undefined> => {
    const myWatchlist = await this.verifyWatchlist(watchlist, 'remove_watchlist_error');
    if (myWatchlist.err) {
      return myWatchlist;
    }

    if (this.store.getWatchlists() === undefined) {
      await this.getWatchlist();
    }

    const removedWatchlist = await this.request.removeWatchlist(myWatchlist.result);
    if (removedWatchlist.err) {
      return removedWatchlist;
    } else {
      this.store.removeWatchlist(myWatchlist.result);
      this.call({
        type: 'watchlist_update',
        watchlist: this.store.getWatchlists() ?? [],
      });
      return { result: undefined };
    }
  };

  protected onSubscribe = (): WatchlistFunctions => ({
    addTickerToWatchlist: this.addTickerToWatchlist,
    createWatchlist: this.createWatchlist,
    getWatchlist: this.getWatchlist,
    removeTickerFromWatchlist: this.removeTickerFromWatchlist,
    removeWatchlist: this.removeWatchlist,
  });

  protected onFirstSubscription = (): void => {
    this.requestSubscription = this.request.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.requestSubscription?.unsubscribe();
  };

  private verifyWatchlistHelper = (watchlist: Watchlist) =>
    this.store.getWatchlists()?.find(item => watchlist.watchlistId === item.watchlistId);

  private verifyWatchlist = async (
    watchlist: Watchlist,
    errorType: Extract<WatchlistRequestEvent, { type: 'error' }>['errorType'],
  ): SafePromise<Watchlist> => {
    if (this.store.shouldWeFetchWatchlist() === true) {
      await this.getWatchlist();
    }
    const workingWatchlist = this.verifyWatchlistHelper(watchlist);
    if (workingWatchlist === undefined) {
      this.store.addWatchlist(watchlist);
      await this.getWatchlist();
      const workingWatchlist = this.verifyWatchlistHelper(watchlist);
      if (workingWatchlist === undefined) {
        const error = new SafeError('watchlist given is not valid', 'watchlist_not_verified');
        this.call({
          error: error,
          errorType,
          type: 'error',
        });
        return { err: error };
      }
      return { result: workingWatchlist };
    }
    return { result: workingWatchlist };
  };
}
