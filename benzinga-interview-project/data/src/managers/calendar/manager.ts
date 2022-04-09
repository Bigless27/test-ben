import { CalendarTypeManager } from './typeManager';
import { CalendarManagerEvent, CalendarType } from './entities';
import { Environments } from '../../env';
import { Subscribable } from '@benzinga/subscribable';
import { SessionManager } from '../session';

type CalendarUrl = Environments['CALENDAR_RESTFUL_URL'];

export class CalendarManager extends Subscribable<CalendarManagerEvent> {
  private url: CalendarUrl;
  private managers = new Map<CalendarType, CalendarTypeManager>();
  private session: SessionManager;

  constructor(url: CalendarUrl, session: SessionManager) {
    super();
    this.url = url;
    this.session = session;
  }

  public getManager = (calendarType: CalendarType = CalendarType.earnings): CalendarTypeManager => {
    console.debug(`get calendar manager ${calendarType}`);
    let manager = this.managers.get(calendarType);
    if (manager === undefined) {
      manager = new CalendarTypeManager(this.url, calendarType, this.session);
      this.managers.set(calendarType, manager);
    }
    return manager;
  };
}
