import { SafeError } from '@benzinga/safe-await';
import { Subscribable } from '@benzinga/subscribable';
import { UUID } from '../notes';
import { SessionManager } from '../session';
import { WatchlistsById } from '../watchlist';
import {
  CalendarCallType,
  CalendarEvents,
  CalendarManagerEvent,
  CalendarParameters,
  ErrorType,
  WidgetId,
} from './entities';
import { EventsAction } from './generateManagerParams';
import { CALENDAR_PAGESIZE } from './generateRestfulParams';
import { CalendarRestful } from './restful';

export class CalendarRequest extends Subscribable<CalendarManagerEvent> {
  private restful: CalendarRestful;

  constructor(restfulURL: URL, session: SessionManager) {
    super();
    this.restful = new CalendarRestful(restfulURL, session);
  }

  public updateEvents = async (
    widgetId: WidgetId,
    parameters: CalendarParameters,
    watchlistsById: WatchlistsById,
    prevEvents: CalendarEvents[] | undefined,
  ): Promise<void> => {
    const newEvents = await this.restful.fetchEvents(parameters, watchlistsById, CALENDAR_PAGESIZE);
    if (newEvents.err) {
      this.call({
        error: newEvents.err,
        errorType: ErrorType.UPDATE_EVENTS,
        type: CalendarCallType.ERROR,
        widgetId,
      });
    } else if (newEvents.result.length) {
      this.call({
        newEvents: newEvents.result,
        parameters,
        prevEvents,
        type: CalendarCallType.UPDATE_EVENTS,
        widgetId,
      });
    }
  };

  public loadEvents = async (
    widgetId: WidgetId,
    requestParameters: CalendarParameters | undefined,
    parameters: CalendarParameters,
    watchlistsById: WatchlistsById,
    prevEvents: CalendarEvents[] | undefined,
    eventsAction: EventsAction,
    sagaId: UUID = '',
    pagesize: number = CALENDAR_PAGESIZE,
  ): Promise<void> => {
    let error!: SafeError;
    if (requestParameters) {
      const newEvents = await this.restful.fetchEvents(requestParameters, watchlistsById, pagesize);
      if (newEvents.err) {
        error = newEvents.err;
      } else {
        this.call({
          eventsAction,
          newEvents: newEvents.result,
          parameters,
          prevEvents,
          requestParameters,
          sagaId,
          type: CalendarCallType.SET_EVENTS,
          watchlistsById,
          widgetId,
        });
      }
    } else {
      error = new SafeError('No parameters found', 'undefined_parameters');
    }
    if (error) {
      this.call({
        error,
        errorType: ErrorType.GET_EVENTS,
        type: CalendarCallType.ERROR,
        widgetId,
      });
    }
  };

  public amendEvents = (
    widgetId: WidgetId,
    parameters: CalendarParameters | undefined,
    watchlistsById: WatchlistsById,
    prevEvents: CalendarEvents[] | undefined,
    eventsAction: EventsAction,
    sagaId: UUID,
  ): void => {
    if (parameters) {
      this.call({
        eventsAction,
        newEvents: [],
        parameters,
        prevEvents,
        requestParameters: parameters,
        sagaId,
        type: CalendarCallType.SET_EVENTS,
        watchlistsById,
        widgetId,
      });
    }
  };

  public setParameters = (widgetId: WidgetId, parameters: CalendarParameters | undefined, sagaId: UUID): void => {
    if (parameters) {
      this.call({
        parameters,
        sagaId,
        type: CalendarCallType.SET_PARAMETERS,
        widgetId,
      });
    }
  };
}
