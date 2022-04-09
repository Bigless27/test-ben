import { StockSymbol, Sound } from '../../entities';

export type SymbolId = string;
export type WatchlistId = string;

export interface WatchlistSymbol {
  countWeek: number;
  symbol: StockSymbol;
  symbolId: SymbolId;
  watchlistId: WatchlistId;
}

export interface Watchlist {
  emailSummary: boolean;
  name: string;
  realtimeBZ: boolean;
  realtimePR: boolean;
  realtimeSEC: boolean;
  sound: Sound;
  symbols: WatchlistSymbol[];
  watchlistId: WatchlistId;
}

export interface Watchlists {
  isFetching: boolean;
  watchlistIds: WatchlistId[];
}

export type WatchlistsById = Record<WatchlistId, Watchlist>;
