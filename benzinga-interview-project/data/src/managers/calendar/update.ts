import { CalendarCallType, CalendarEvents, CalendarManagerEvent, UpdateCalendarEvent } from './entities';

const getUniqueEventsData = (
  newEvents: CalendarEvents[],
  prevEvents: CalendarEvents[] = [],
): { onlyNewEvents: CalendarEvents[]; updatedOldEvents: CalendarEvents[] } => {
  const newEventsMap = newEvents.reduce((result, event) => {
    result.set(event.id, event);
    return result;
  }, new Map<string, CalendarEvents>());

  const updatedOldEvents = [] as CalendarEvents[];
  prevEvents.forEach(event => {
    const { id } = event;
    const newEvents = newEventsMap.get(id);
    if (newEvents) {
      updatedOldEvents.push(newEvents);
      newEventsMap.delete(id);
    } else {
      updatedOldEvents.push(event);
    }
  });
  const onlyNewEvents = Array.from(newEventsMap.values());

  return { onlyNewEvents, updatedOldEvents };
};

export const update = (event: CalendarManagerEvent): void => {
  const { newEvents, prevEvents, type } = event as UpdateCalendarEvent;

  if (type === CalendarCallType.UPDATE_EVENTS) {
    const { onlyNewEvents, updatedOldEvents } = getUniqueEventsData(newEvents, prevEvents);
    (event as UpdateCalendarEvent).events = [...onlyNewEvents, ...updatedOldEvents];
    (event as UpdateCalendarEvent).lastUpdatedEventsIds = onlyNewEvents.map(e => e.id);
  }
};
