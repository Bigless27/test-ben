import * as uuid from 'uuid';

import { CalendarRequest } from './request';
import { CalendarStore } from './store';
import {
  CalendarCallType,
  CalendarEvents,
  CalendarParameters,
  CalendarManagerEvent,
  CalendarType,
  CalendarUpdateModeTable,
  DateRange,
  SetCalendarEvent,
  WidgetId,
} from './entities';
import { WatchlistId, WatchlistsById } from '../watchlist';
import { getRequestParametersApi, getStartingParameters, NoRequestEventsActions } from './generateManagerParams';
import { transform } from './transform';
import { update } from './update';
import { omit, recalculateParameters, standardDates } from './utils';
import { calendarParameters, CALENDAR_PAGESIZE } from './generateRestfulParams';
import { UUID } from '../notes';
import { DefaultTableParameters, StockSymbol } from '../../entities';
import { SessionManager } from '../session';
import { Subscribable } from '@benzinga/subscribable';

export class CalendarTypeManager extends Subscribable<CalendarManagerEvent> {
  public request: CalendarRequest;
  private calendarType: CalendarType;
  private store: CalendarStore;

  constructor(restfulURL: URL, calendarType: CalendarType, session: SessionManager) {
    super();
    this.calendarType = calendarType;
    this.request = new CalendarRequest(restfulURL, session);
    this.store = new CalendarStore();
    this.request.subscribe(event => console.debug('CalendarManagerEvent', JSON.parse(JSON.stringify({ ...event }))));
    this.request.subscribe(this.amendEvent);
    this.request.subscribe(transform);
    this.request.subscribe(update);
    this.request.subscribe(this.store.storeParameters);
    this.request.subscribe(this.store.storeEvents);
    this.request.subscribe(this.setUpdateIntervalEventCall);
  }

  public loadCalendarEvents = (
    widgetId: WidgetId,
    watchlistsById: WatchlistsById,
    newParameters: CalendarParameters,
  ): void => {
    const parametersMap = this.store.generateParametersMap();
    const { events, parameters } = getStartingParameters(parametersMap, newParameters, watchlistsById);
    this.store.setEvents(widgetId, events, parameters);
    this.loadNewEvents(widgetId, newParameters, watchlistsById, events, parameters);
  };

  public stopUpdates = (widgetId: WidgetId, clear?: boolean): void => {
    const updateInterval = this.store.getUpdateInterval(widgetId);
    if (updateInterval) {
      clearInterval(updateInterval);
      // if clear is false it will set updateInterval to undefined but preserve intervalCallback
      this.store.setUpdateInterval(widgetId, undefined, clear ? null : undefined);
    }
  };

  public restartUpdates = (widgetId: WidgetId): void => {
    this.stopUpdates(widgetId);
    const intervalCallback = this.store.getIntervalCallback(widgetId);
    let updateInterval = this.store.getUpdateInterval(widgetId);
    if (!updateInterval && intervalCallback) {
      updateInterval = setInterval(intervalCallback, CalendarUpdateModeTable[this.calendarType]);
      this.store.setUpdateInterval(widgetId, updateInterval);
    }
  };

  public updateCalendarEvents = (widgetId: WidgetId, watchlistsById: WatchlistsById): void => {
    const prevEvents = this.getSafeEvents(widgetId);
    const parameters = recalculateParameters(prevEvents, this.getSafeParameters(widgetId));
    this.request.updateEvents(widgetId, parameters, watchlistsById, prevEvents);
  };

  public resetCalendar = (widgetId: WidgetId, watchlistsById: WatchlistsById): void => {
    const parameters = this.getSafeParameters(widgetId);
    const newParams = {
      ...parameters,
      table: {
        ...parameters.table,
        [this.calendarType]: DefaultTableParameters,
      },
    };
    const newParameters = { ...newParams, symbols: [], watchlistIds: [] };
    this.loadCalendarEvents(widgetId, watchlistsById, standardDates(newParameters));
  };

  public changeSymbols(widgetId: WidgetId, watchlistsById: WatchlistsById, symbols: StockSymbol[]): void {
    const newParameters = { ...this.getSafeParameters(widgetId), symbols };
    this.loadCalendarEvents(widgetId, watchlistsById, standardDates(newParameters));
  }

  // used when calendarType changes
  public loadInitialEvents = (widgetId: WidgetId, watchlistsById: WatchlistsById): void => {
    const newParameters = { ...this.getSafeParameters(widgetId), calendarType: this.calendarType };
    this.loadCalendarEvents(widgetId, watchlistsById, standardDates(newParameters));
  };

  public changeDate = (widgetId: WidgetId, watchlistsById: WatchlistsById, { dateEnd, dateStart }: DateRange): void => {
    const newParameters = { ...this.getSafeParameters(widgetId), dateEnd, dateStart };
    this.loadCalendarEvents(widgetId, watchlistsById, newParameters);
  };

  public changeWatchlists = (widgetId: WidgetId, watchlistsById: WatchlistsById, watchlistIds: WatchlistId[]): void => {
    const newParameters = { ...this.getSafeParameters(widgetId), watchlistIds };
    this.loadCalendarEvents(widgetId, watchlistsById, standardDates(newParameters));
  };

  public getSafeEvents = (widgetId: WidgetId): CalendarEvents[] => this.store.getEvents(widgetId) || [];

  private getSafeParameters = (widgetId: WidgetId): CalendarParameters =>
    this.store.getParameters(widgetId) || { ...calendarParameters };

  private setUpdateIntervalEventCall = (event: CalendarManagerEvent): void => {
    const { type, watchlistsById, widgetId } = event as SetCalendarEvent;
    if (type === CalendarCallType.SET_EVENTS) {
      this.setUpdateInterval(widgetId, watchlistsById);
    }
  };

  private setUpdateInterval = (widgetId: WidgetId, watchlistsById: WatchlistsById): void => {
    this.stopUpdates(widgetId, true);
    const intervalCallback = () => {
      if (!this.store.getIsLoading(widgetId)) {
        this.updateCalendarEvents(widgetId, watchlistsById);
      }
    };
    const updateInterval = setInterval(intervalCallback, CalendarUpdateModeTable[this.calendarType]);

    this.store.setUpdateInterval(widgetId, updateInterval, intervalCallback);
  };

  private loadNewEvents = (
    widgetId: WidgetId,
    parameters: CalendarParameters | undefined,
    watchlistsById: WatchlistsById,
    prevEvents: CalendarEvents[] | undefined,
    prevParameters: CalendarParameters | undefined,
  ) => {
    prevParameters ??= this.store.getParameters(widgetId);
    const oldParameters: CalendarParameters | undefined =
      prevParameters && omit<CalendarParameters>(prevParameters, 'updated');
    const newParameters: CalendarParameters | undefined = parameters && omit<CalendarParameters>(parameters, 'updated');
    const sagaParameters = newParameters ?? oldParameters;
    if (sagaParameters) {
      const actions = getRequestParametersApi(prevEvents, oldParameters, newParameters, watchlistsById);

      const sagaId: UUID = uuid.v4();
      this.request.setParameters(widgetId, sagaParameters, sagaId);

      const promises: Promise<void>[] = [];
      for (const action of actions) {
        const [eventsAction, requestParameters = sagaParameters, pagesize = CALENDAR_PAGESIZE] = action;
        if (NoRequestEventsActions.includes(eventsAction)) {
          this.request.amendEvents(widgetId, requestParameters, watchlistsById, prevEvents, eventsAction, sagaId);
        } else {
          promises.push(
            this.request.loadEvents(
              widgetId,
              requestParameters,
              sagaParameters,
              watchlistsById,
              prevEvents,
              eventsAction,
              sagaId,
              pagesize,
            ),
          );
        }
      }
      if (promises.length) {
        Promise.all(promises);
      }
    }
  };

  private amendEvent = (event: CalendarManagerEvent): void => {
    (event as SetCalendarEvent).prevEvents = this.store.getEvents(event.widgetId);
  };
}
