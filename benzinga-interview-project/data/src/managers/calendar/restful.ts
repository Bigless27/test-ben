import { SafePromise } from '@benzinga/safe-await';
import { SessionManager } from '../session';

import { RestfulClient } from '../../utils';
import { WatchlistsById } from '../watchlist';
import { CalendarEvents, CalendarParameters } from './entities';
import { createCalendarUrl } from './generateRestfulParams';

export class CalendarRestful extends RestfulClient {
  constructor(hostname: URL, session: SessionManager) {
    super(hostname, session, { 'x-device-key': true });
  }

  public fetchEvents = async (
    parameters: CalendarParameters,
    watchlistsById: WatchlistsById,
    pagesize: number,
  ): SafePromise<CalendarEvents[]> => {
    const url = new URL(createCalendarUrl(parameters, watchlistsById, pagesize));
    return await this.get(url, {
      credentials: 'same-origin',
      headers: new Headers({
        'Cache-Control': 'no-cache',
        accept: 'application/json',
        'content-type': 'application/json',
      }),
      timeout: 30000,
    });
  };
}
