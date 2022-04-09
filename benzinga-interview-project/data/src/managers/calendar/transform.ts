/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DateTime } from '../../utils';

import { UUID, WatchlistsById } from '..';
import { CalendarCallType, CalendarEvents, CalendarParameters, CalendarManagerEvent, ErrorType } from './entities';
import { EventsAction, getDateKey } from './generateManagerParams';
import { CALENDAR_PAGESIZE, getSymbolsFromParameters } from './generateRestfulParams';
import { uniqBy } from './utils';

const currentSaga = {
  batchLoaded: false,
  id: '' as UUID,
};

const captureMessage = async (fetchEvents: CalendarEvents[]): Promise<void> => {
  const duplicates = fetchEvents
    .filter((arrElem, index, arr) => arr.slice(index + 1).find(({ id }) => id === arrElem.id))
    .map(({ id }) => id);
  console.error(`Duplicate events in Calendar grid: ${duplicates}`); // for debugging purposes - remove once it goes beta
};

const createTimeComparator = (dateKey: keyof CalendarEvents) => (a: CalendarEvents, b: CalendarEvents): -1 | 1 => {
  const time = 'time' as keyof CalendarEvents;
  const aDateTime = DateTime.fromISO(a[dateKey] as string, a[time] as string);
  const bDateTime = DateTime.fromISO(b[dateKey] as string, b[time] as string);
  return aDateTime > bDateTime ? -1 : 1;
};

export const getFirstLoadEvents = (
  eventsAction: EventsAction,
  parameters: CalendarParameters,
  watchlistsById: WatchlistsById,
  prevEvents: CalendarEvents[] = [],
  payloadEvents: CalendarEvents[] = [],
): CalendarEvents[] => {
  const dateKey: keyof CalendarEvents = getDateKey(parameters.calendarType);
  switch (eventsAction) {
    case EventsAction.addFirstBatch:
      return currentSaga.batchLoaded ? prevEvents : payloadEvents;
    case EventsAction.addSymbols:
      return prevEvents.concat(payloadEvents).sort(createTimeComparator(dateKey)).splice(0, CALENDAR_PAGESIZE);
    case EventsAction.appendNew: {
      const lastDateIndex = prevEvents.findIndex(event => event[dateKey] === payloadEvents[0]?.[dateKey]);
      const usablePrevEvents = lastDateIndex !== -1 ? prevEvents.slice(0, lastDateIndex) : prevEvents;
      return usablePrevEvents.concat(payloadEvents).slice(0, CALENDAR_PAGESIZE);
    }
    case EventsAction.doNothing:
      return prevEvents;
    case EventsAction.prependNew:
      return payloadEvents.concat(prevEvents).slice(0, CALENDAR_PAGESIZE);
    case EventsAction.removeSymbols: {
      const symbols = getSymbolsFromParameters(parameters, watchlistsById);
      return prevEvents.filter(event => symbols.has(event.ticker));
    }
    case EventsAction.replaceAll:
      return payloadEvents;
    case EventsAction.slicePost: {
      const dateStartMoment = DateTime.fromISO(parameters.dateStart);
      const lastDateIndex = prevEvents.findIndex(event => DateTime.fromISO(event[dateKey] as string) < dateStartMoment);
      return lastDateIndex !== -1 ? prevEvents.slice(0, lastDateIndex) : prevEvents;
    }
    case EventsAction.slicePre: {
      const dateEndMoment = DateTime.fromISO(parameters.dateEnd);
      const firstDateIndex = prevEvents.findIndex(event =>
        DateTime.fromISO(event[dateKey] as string).equalsOrBefore(dateEndMoment),
      );
      return firstDateIndex !== -1 ? prevEvents.slice(firstDateIndex) : [];
    }
    default:
      return payloadEvents;
  }
};

export const transform = (event: CalendarManagerEvent): void => {
  switch (event.type) {
    case CalendarCallType.SET_PARAMETERS:
      currentSaga.id = event.sagaId;
      currentSaga.batchLoaded = false;
      break;
    case CalendarCallType.ERROR:
      if (event.errorType === ErrorType.GET_EVENTS) {
        currentSaga.id = '';
        event.events = [];
        event.lastUpdatedEventsIds = [];
      }
      break;
    case CalendarCallType.SET_EVENTS:
      if (event.sagaId === currentSaga.id) {
        const { eventsAction, newEvents, prevEvents, requestParameters: parameters, watchlistsById } = event;

        const fetchEvents = getFirstLoadEvents(eventsAction, parameters, watchlistsById, prevEvents, newEvents);
        const fetchEventsUniq = uniqBy(fetchEvents, (event: CalendarEvents) => event.id);
        currentSaga.batchLoaded = true;

        event.events = fetchEventsUniq;
        event.lastUpdatedEventsIds = [];

        if (fetchEvents.length !== fetchEventsUniq.length) {
          captureMessage(fetchEvents);
        }
      } else {
        event.type = CalendarCallType.VOID;
      }
  }
};
