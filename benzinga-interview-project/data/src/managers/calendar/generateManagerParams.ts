import { DateTime } from '../../utils';
import { CALENDAR_PAGESIZE, CALENDAR_SCREEN_SIZE, getSymbolsFromParameters } from './generateRestfulParams';
import { StockSymbol } from '../../entities/stock';
import { CalendarEvents, CalendarParameters, CalendarType, WidgetId, ExtremeDateValue } from './entities';
import { WatchlistsById } from '../watchlist';
import { isEqualArrShallow } from './utils';
import { getFirstLoadEvents } from './transform';

type CalendarParameterKey = keyof CalendarParameters;

enum ResetParam {
  calendarType = 'calendarType',
  isPopout = 'isPopout',
  type = 'type',
}

enum AmendParam {
  dateEnd = 'dateEnd',
  dateStart = 'dateStart',
  symbols = 'symbols',
  watchlistIds = 'watchlistIds',
}

type RequestParametersApi = [EventsAction, CalendarParameters?, number?];

const resetParamsKeys: CalendarParameterKey[] = [ResetParam.calendarType, ResetParam.isPopout, ResetParam.type];

export enum EventsAction {
  addFirstBatch, // adds screen size batch
  addSymbols, // adds a symbol
  appendNew, // appends response events to the current events array
  doNothing,
  prependNew, // prepends response events to the current events array
  removeSymbols, // filters out a symbol
  replaceAll, // replaces current events with response ones
  slicePost, // slices off the events dated before new start date
  slicePre, // removes the events dated after new end date
}

export const NoRequestEventsActions = [
  EventsAction.doNothing,
  EventsAction.removeSymbols,
  EventsAction.slicePost,
  EventsAction.slicePre,
];

// calendarType: splits have date_announced instead of date
export enum CalendarDateKey {
  date = 'date',
  dateEx = 'date_ex',
  exDividendDate = 'ex_dividend_date',
}

const dateKeyMapping = ({
  [CalendarType.splits]: CalendarDateKey.dateEx,
  [CalendarType.dividends]: CalendarDateKey.exDividendDate,
} as unknown) as Record<CalendarType, keyof CalendarEvents>;

const replaceAllActions = (parameters: CalendarParameters): RequestParametersApi[] => [
  [EventsAction.addFirstBatch, parameters, CALENDAR_SCREEN_SIZE],
  [EventsAction.replaceAll],
];

export const getDateKey = (calendarType: CalendarType): keyof CalendarEvents =>
  dateKeyMapping[calendarType] || CalendarDateKey.date;

const getDateChangedParams = (
  oldParameters: CalendarParameters,
  newParameters: CalendarParameters,
  events: CalendarEvents[],
  hasMaxPagesize: boolean,
): RequestParametersApi[] => {
  const dateKey = getDateKey(newParameters.calendarType as CalendarType);
  const lastLoadedDateString = events[events.length - 1][dateKey] as string;
  const lastLoadedDateMoment = DateTime.fromISO(lastLoadedDateString);
  const newDateStartMoment = DateTime.fromISO(newParameters.dateStart);
  const oldDateStartMoment = DateTime.fromISO(oldParameters.dateStart ?? ExtremeDateValue.min);
  const newDateEndMoment = DateTime.fromISO(newParameters.dateEnd);
  const oldDateEndMoment = DateTime.fromISO(oldParameters.dateEnd);
  const relevantOldStartDateMoment: DateTime = hasMaxPagesize
    ? DateTime.fromISO(lastLoadedDateString).plus({ day: 1 })
    : oldDateStartMoment;

  let actions = [] as RequestParametersApi[];
  if (
    newDateStartMoment > oldDateEndMoment ||
    newDateEndMoment < relevantOldStartDateMoment ||
    relevantOldStartDateMoment > oldDateEndMoment
  ) {
    // there is no usable old data
    actions = replaceAllActions(newParameters);
  } else {
    let endEventIndex = 0;
    // dateEnd changed
    if (newDateEndMoment > oldDateEndMoment) {
      const dateStart = DateTime.fromISO(oldParameters.dateEnd).plus({ day: 1 }).toISODateString();

      actions.push([EventsAction.prependNew, { ...newParameters, dateStart }]);
    } else if (newDateEndMoment < oldDateEndMoment) {
      actions.push([EventsAction.slicePre]);
      endEventIndex = events.findIndex(event => DateTime.fromISO(event[dateKey] as string) <= newDateEndMoment);
    }

    // dateStart changed - adding another action
    if (hasMaxPagesize) {
      if (newDateStartMoment > lastLoadedDateMoment) {
        actions.push([EventsAction.slicePost]);
      } else if (endEventIndex) {
        // adding new if there the events number is reduced by slicePre
        const dateEnd = lastLoadedDateMoment.toISODateString();
        const startEventIndex = events.findIndex(event => event[dateKey] === lastLoadedDateString);
        actions.push([
          EventsAction.appendNew,
          { ...newParameters, dateEnd },
          CALENDAR_PAGESIZE - startEventIndex + endEventIndex,
        ]);
      }
    } else {
      if (newDateStartMoment > oldDateStartMoment) {
        actions.push([EventsAction.slicePost]);
      } else if (newParameters.dateStart !== oldParameters.dateStart) {
        const dateEnd = DateTime.fromISO(oldParameters.dateStart).plus({ day: -1 }).toISODateString();
        actions.push([
          EventsAction.appendNew,
          { ...newParameters, dateEnd },
          CALENDAR_PAGESIZE - events.length + endEventIndex,
        ]);
      }
    }
  }

  return actions.length ? actions : [[EventsAction.doNothing]];
};

const getSymbolsChangedParams = (
  oldParameters: CalendarParameters,
  newParameters: CalendarParameters,
  watchlistsById: WatchlistsById,
  hasMaxPagesize: boolean,
): RequestParametersApi[] => {
  const oldSymbols = getSymbolsFromParameters(oldParameters, watchlistsById);
  const newSymbols = getSymbolsFromParameters(newParameters, watchlistsById);

  const symbols: StockSymbol[] = []; // added symbols
  let keptSymbolsNo = 0;
  newSymbols.forEach(symbol => {
    if (!oldSymbols.has(symbol)) {
      symbols.push(symbol);
    } else {
      keptSymbolsNo++;
    }
  });

  const hasMissingSymbols = oldSymbols.size !== keptSymbolsNo;
  let actions: RequestParametersApi[] = [];
  if ((hasMaxPagesize && hasMissingSymbols && keptSymbolsNo) || !keptSymbolsNo) {
    actions = replaceAllActions(newParameters);
  } else {
    if (hasMissingSymbols) {
      actions.push([EventsAction.removeSymbols]);
    }
    if (symbols.length) {
      actions.push([EventsAction.addSymbols, { ...newParameters, symbols, watchlistIds: [] }]);
    }
  }
  return actions.length ? actions : [[EventsAction.doNothing]];
};

export const getRequestParametersApi = (
  events: CalendarEvents[] | undefined,
  oldParameters: CalendarParameters | undefined,
  newParameters: CalendarParameters | undefined,
  watchlistsById: WatchlistsById,
): RequestParametersApi[] => {
  if (!newParameters) {
    return (events && events.length) || !oldParameters
      ? [[EventsAction.doNothing]]
      : [[EventsAction.addFirstBatch, oldParameters, CALENDAR_SCREEN_SIZE], [EventsAction.replaceAll]];
  }
  if (oldParameters) {
    if (resetParamsKeys.some(key => oldParameters[key] !== newParameters[key]) || !events || !events.length) {
      return replaceAllActions(newParameters);
    }
    let datesChanged = false;
    let symbolsChanged = false;
    if (
      oldParameters[AmendParam.dateEnd] !== newParameters[AmendParam.dateEnd] ||
      oldParameters[AmendParam.dateStart] !== newParameters[AmendParam.dateStart]
    ) {
      datesChanged = true;
    }
    if (
      !isEqualArrShallow(oldParameters[AmendParam.symbols], newParameters[AmendParam.symbols]) ||
      !isEqualArrShallow(oldParameters[AmendParam.watchlistIds], newParameters[AmendParam.watchlistIds])
    ) {
      symbolsChanged = true;
    }

    if (datesChanged && symbolsChanged) {
      return replaceAllActions(newParameters);
    }
    const hasMaxPagesize = events.length >= CALENDAR_PAGESIZE;
    if (datesChanged) {
      return getDateChangedParams(oldParameters, newParameters, events, hasMaxPagesize);
    }
    if (symbolsChanged) {
      return getSymbolsChangedParams(oldParameters, newParameters, watchlistsById, hasMaxPagesize);
    }
  } else {
    return replaceAllActions(newParameters);
  }
  return [[EventsAction.doNothing]];
};

interface EventsData {
  events: CalendarEvents[];
  parameters: CalendarParameters;
}

export type ParametersMap = Map<WidgetId, EventsData>;

export const getStartingParameters = (
  parametersMap: ParametersMap,
  newParameters: CalendarParameters,
  watchlistsById: WatchlistsById,
): EventsData => {
  let mapKey!: WidgetId;
  let startingEventsSize = 0;
  parametersMap.forEach(({ events, parameters }, widgetId) => {
    const actions = getRequestParametersApi(events, parameters, newParameters, watchlistsById);
    const latestEventsSize = actions.reduce((eventsSum, action) => {
      eventsSum += getFirstLoadEvents(action[0], parameters, watchlistsById, events, []).length;
      return eventsSum;
    }, 0);
    if (latestEventsSize > startingEventsSize) {
      mapKey = widgetId;
      startingEventsSize = latestEventsSize;
    }
  });
  return parametersMap.get(mapKey) ?? ({} as EventsData);
};
