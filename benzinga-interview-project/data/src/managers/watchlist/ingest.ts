import { SafeError, SafePromise } from '@benzinga/safe-await';
import { StockSymbol, Sound } from '../../entities';
import { SymbolId, Watchlist, WatchlistId, WatchlistSymbol } from './entities';

interface IncomingWatchlistSymbol {
  alert_id: string;
  alert_name: StockSymbol;
  count_week: number;
  is_bz: 1 | 0;
  is_bzpro: 1 | 0;
  is_sec: 1 | 0;
  portfolio_id: WatchlistId;
  send_realtime: 1 | 0;
  sound: Sound;
  status: '1' | '0';
  type: 'ticker';
}

type IncomingWatchlistSymbolObject = {
  [id in WatchlistId]: IncomingWatchlistSymbol;
};

interface IncomingWatchlist {
  alerts: IncomingWatchlistSymbolObject;
  portfolio_id: WatchlistId;
  portfolio_name: string;
  realtime_bz: string;
  realtime_pr: string;
  realtime_sec: string;
  send_summary: 1 | 0;
  sound: Sound;
  status: '1' | '0';
}

interface RestfulResult<DATA> {
  data: DATA;
  response_code: number;
}

export type IncomingWatchlistSymbolResult = RestfulResult<Record<SymbolId, IncomingWatchlistSymbol>[]>;
export type IncomingWatchlistResult = RestfulResult<Record<WatchlistId, IncomingWatchlist>>;

export const parseSymbols = (alerts: Record<SymbolId, IncomingWatchlistSymbol>): WatchlistSymbol[] => {
  return Object.values(alerts).map(alert => ({
    countWeek: alert.count_week,
    symbol: alert.alert_name,
    symbolId: alert.alert_id,
    watchlistId: alert.portfolio_id,
  }));
};

export const ingestSymbols = async (
  watchlistData: SafePromise<IncomingWatchlistSymbolResult>,
): SafePromise<WatchlistSymbol[]> => {
  const rawWatchlists = await watchlistData;

  if (rawWatchlists.err) {
    return rawWatchlists;
  } else {
    if (rawWatchlists.result?.data) {
      return { result: rawWatchlists.result.data.map(item => parseSymbols(item)).flat() };
    } else {
      return { err: new SafeError('did not get a valid watchlist Symbols', 'invalid_watchlist') };
    }
  }
};

export const ingestWatchlist = async (
  watchlistData: SafePromise<IncomingWatchlistResult>,
): SafePromise<Watchlist[]> => {
  const rawWatchlists = await watchlistData;

  if (rawWatchlists.err) {
    return rawWatchlists;
  } else {
    if (rawWatchlists.result?.data) {
      return {
        result: Object.values(rawWatchlists.result.data).map(watchlist => ({
          emailSummary: !!watchlist.send_summary,
          name: watchlist.portfolio_name,
          realtimeBZ: !!watchlist.realtime_bz,
          realtimePR: !!watchlist.realtime_pr,
          realtimeSEC: !!watchlist.realtime_sec,
          sound: watchlist.sound,
          symbols: parseSymbols(watchlist.alerts),
          watchlistId: watchlist.portfolio_id,
        })),
      };
    } else {
      return { err: new SafeError('did not get a valid watchlist', 'invalid_watchlist') };
    }
  }
};
