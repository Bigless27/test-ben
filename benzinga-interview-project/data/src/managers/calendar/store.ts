import {
  CalendarCallType,
  CalendarEvents,
  CalendarParameters,
  CalendarManagerEvent,
  WidgetId,
  CalendarTransient,
  SetCalendarEvent,
  SetParametersEvent,
} from './entities';
import { ParametersMap } from './generateManagerParams';
import { calendarParameters, calendarTransient } from './generateRestfulParams';

type ByWidget<T> = {
  [key in WidgetId]: T;
};
export class CalendarStore {
  private parameters: ByWidget<CalendarParameters>;
  private transient: ByWidget<CalendarTransient>;

  constructor() {
    this.transient = {};
    this.parameters = {};
  }

  public getLastUpdateEventIds = (widgetId: WidgetId): CalendarEvents['id'][] | undefined =>
    this.transient[widgetId]?.lastUpdatedEventsIds;

  public getIsLoading = (widgetId: WidgetId): boolean => !!this.transient[widgetId]?.isLoading;

  public getEvents = (widgetId: WidgetId): CalendarEvents[] | undefined => {
    return this.transient[widgetId]?.events;
  };

  public getParameters = (widgetId: WidgetId): CalendarParameters | undefined => this.parameters[widgetId];

  public storeParameters = (event: CalendarManagerEvent): void => {
    const { parameters, type, widgetId } = event as SetParametersEvent;
    this.initWidget(widgetId);
    const newParameters = { ...this.getParameters(widgetId), ...parameters };
    if (type === CalendarCallType.SET_PARAMETERS) {
      this.parameters[widgetId] = newParameters;
    }
  };

  public generateParametersMap = (): ParametersMap => {
    const parametersMap: ParametersMap = new Map();
    Object.keys(this.parameters).forEach(widgetId => {
      const events = this.transient[widgetId]?.events;
      if (events?.length) {
        parametersMap.set(widgetId, { events, parameters: this.parameters[widgetId] });
      }
    });
    return parametersMap;
  };

  public setEvents = (
    widgetId: WidgetId,
    events: CalendarEvents[],
    parameters: CalendarParameters,
    lastUpdatedEventsIds: CalendarEvents['id'][] = [],
  ): void => {
    this.initWidget(widgetId);
    this.transient[widgetId].events = events;
    this.transient[widgetId].lastUpdatedEventsIds = lastUpdatedEventsIds;
    this.transient[widgetId].isLoading = false;
    if (parameters) {
      this.parameters[widgetId] = parameters;
    }
  };

  public storeEvents = (event: CalendarManagerEvent): void => {
    const { events = [], lastUpdatedEventsIds, parameters, type, widgetId } = event as SetCalendarEvent;
    if (type === CalendarCallType.SET_EVENTS) {
      this.setEvents(widgetId, events, parameters, lastUpdatedEventsIds);
    }
  };

  public setUpdateInterval = (
    widgetId: WidgetId,
    updateInterval?: ReturnType<typeof setTimeout>,
    intervalCallback?: VoidFunction | null, // null will clear callback
  ): void => {
    this.initWidget(widgetId);
    this.transient[widgetId].updateInterval = updateInterval;
    if (intervalCallback !== undefined) {
      this.transient[widgetId].intervalCallback = intervalCallback;
    }
  };

  public getUpdateInterval = (widgetId: WidgetId): ReturnType<typeof setTimeout> | undefined =>
    this.transient[widgetId]?.updateInterval;

  public getIntervalCallback = (widgetId: WidgetId): VoidFunction | undefined | null =>
    this.transient[widgetId]?.intervalCallback;

  private initWidget = (widgetId: WidgetId): void => {
    if (!this.transient[widgetId]) {
      this.transient[widgetId] = { ...calendarTransient };
    }
    if (!this.parameters[widgetId]) {
      this.parameters[widgetId] = { ...calendarParameters };
    }
  };
}
