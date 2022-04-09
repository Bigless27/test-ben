import { Watchlist } from './entities';

export class WatchlistStore {
  private date?: Date;
  private watchlists?: Watchlist[];

  constructor() {
    this.date = undefined;
    this.watchlists = undefined;
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

  public shouldWeFetchWatchlist = (): boolean => {
    const ONE_MIN = 60 * 1000; /* ms */
    const lastCalled = this.date?.getTime() ?? 0; // use this once all watchlist are grabbed from manager
    if (this.watchlists === undefined || Date.now() - lastCalled > ONE_MIN) {
      return true;
    }
    return false;
  };

  public getWatchlists = (): Watchlist[] | undefined => {
    return this.watchlists;
  };

  // returns true if no update was needed;
  public updateWatchlists = (watchlists: Watchlist[]): boolean => {
    if (this.watchlists && WatchlistStore.compareWatchlists(this.watchlists, watchlists)) {
      this.date = new Date();
      return true;
    } else {
      this.watchlists = watchlists;
      return false;
    }
  };

  public addWatchlist = (watchlist: Watchlist): void => {
    if (this.watchlists) {
      this.watchlists.push(watchlist);
    } else {
      this.watchlists = [watchlist];
    }
  };

  public updateWatchlist = (watchlist: Watchlist): void => {
    this.watchlists?.map(item => (item.watchlistId === watchlist.watchlistId ? watchlist : item));
  };

  public removeWatchlist = (watchlist: Watchlist): void => {
    this.watchlists?.filter(item => item.watchlistId !== watchlist.watchlistId);
  };
}
