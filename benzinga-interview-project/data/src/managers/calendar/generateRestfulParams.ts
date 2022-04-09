import { DateTime } from '../../utils';
import { DefaultTableParameters, StockSymbol } from '../../entities';
import { encodeToQuerystring } from '../../utils';

import { WatchlistsById, WatchlistSymbol } from '../watchlist';
import { CalendarType, CalendarParameters, CalendarTransient, WidgetType } from './entities';

export const CALENDAR_PAGESIZE = 10000;
export const CALENDAR_SCREEN_SIZE = 50;
export const reachALimitNotification = {
  description: `
    The result set was larger and capped at ${CALENDAR_PAGESIZE}.
    To see the full dataset, change the date range or limit by watchlist.`,
  message: 'Reach a limit',
};

interface Params {
  [key: string]: string | number | boolean | undefined | null | Params;
}

interface CalendarRequestData extends Params {
  date?: string;
  date_from?: string;
  date_sort?: string;
  date_to?: string;
  display: 'flat';
  tickers?: string;
  updated?: number;
}

export interface CalendarQuery extends Params {
  page: number;
  pagesize: number;
  parameters: CalendarRequestData;
  token: string;
}

export const calendarDefaultType = CalendarType.earnings;

const calendarDefaultDefinitions = {
  [CalendarType.conference]: DefaultTableParameters,
  [CalendarType.dividends]: DefaultTableParameters,
  [CalendarType.earnings]: DefaultTableParameters,
  [CalendarType.economics]: DefaultTableParameters,
  [CalendarType.fda]: DefaultTableParameters,
  [CalendarType.guidance]: DefaultTableParameters,
  [CalendarType.ipos]: DefaultTableParameters,
  [CalendarType.ma]: DefaultTableParameters,
  [CalendarType.offerings]: DefaultTableParameters,
  [CalendarType.optionsActivity]: DefaultTableParameters,
  [CalendarType.ratings]: DefaultTableParameters,
  [CalendarType.retail]: DefaultTableParameters,
  [CalendarType.sec]: DefaultTableParameters,
  [CalendarType.splits]: DefaultTableParameters,
};

export const calendarParameters: CalendarParameters = {
  calendarType: calendarDefaultType,
  dateEnd: DateTime.dateNow().toISODateString(),
  dateStart: DateTime.dateNow().toISODateString(),
  symbols: [] as StockSymbol[],
  table: calendarDefaultDefinitions,
  type: WidgetType.advancedCalendar,
  watchlistIds: [],
};

export const calendarTransient: CalendarTransient = {
  isLoading: false,
  lastUpdatedEventsIds: [],
};

const getApiUrlByCalendarType = (type: CalendarType, defaultType: CalendarType) =>
  type === CalendarType.optionsActivity
    ? `${window.env.API_ROOT}/api/v1/signal/option_activity`
    : type === CalendarType.fda
    ? `${window.env.API_ROOT}/api/v2.1/calendar/fda`
    : `${window.env.API_ROOT}/api/v2/calendar/${type || defaultType}`;

export const getSymbolsFromParameters = (
  parameters: Partial<CalendarParameters>,
  watchlistsById: WatchlistsById,
): Set<StockSymbol> => {
  const symbols = new Set<StockSymbol>(parameters.symbols || []);
  if (!symbols.size) {
    const addSymbol = (symbol: WatchlistSymbol) => symbols.add(symbol.symbol);
    parameters.watchlistIds?.forEach(watchlistId => {
      watchlistsById[watchlistId]?.symbols?.forEach(addSymbol);
    });
  }
  return symbols;
};

export const createCalendarUrl = (
  parameters: CalendarParameters,
  watchlistsById: WatchlistsById,
  pagesize: number,
): string => {
  const requestData: CalendarRequestData = {
    display: 'flat',
  };
  const symbols = [...getSymbolsFromParameters(parameters, watchlistsById)];

  if (symbols?.length) {
    // important! the backend expects `tickers` not `symbols`
    requestData.tickers = symbols.join();
  }

  if (parameters.dateStart || parameters.dateEnd) {
    if (!parameters.dateStart) {
      if (parameters.dateEnd) {
        requestData.date_to = parameters.dateEnd;
      }
    } else if (!parameters.dateEnd) {
      requestData.date_from = parameters.dateStart;
      // if both dateStart && dateEnd
    } else if (parameters.dateStart === parameters.dateEnd) {
      requestData.date = parameters.dateStart;
    } else {
      requestData.date_from = parameters.dateStart;
      requestData.date_to = parameters.dateEnd;
    }

    // Ensure that the correct date field is used
    if (parameters.calendarType === CalendarType.dividends || parameters.calendarType === CalendarType.splits) {
      requestData.date_search_field = 'ex';
    }
  }

  if (parameters.updated) {
    requestData.updated = parameters.updated;
  }

  const { calendarType } = parameters;

  const url = getApiUrlByCalendarType(calendarType, calendarDefaultType);

  const query: CalendarQuery = {
    page: 0,
    pagesize,
    parameters: requestData,
    token: window.env.CALENDAR_KEY,
  };
  return `${url}?${encodeToQuerystring(query)}`;
};
