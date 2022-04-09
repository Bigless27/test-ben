import { SafePromise } from '@benzinga/safe-await';

import { RestfulClient } from '../../utils';
import { IncomingSecuritiesResult } from './ingest';
import { SessionManager } from '../session';

export class SecuritiesRestful extends RestfulClient {
  constructor(hostname: URL, session: SessionManager) {
    super(hostname, session, { 'x-device-key': true });
  }

  getFinancials = (symbols?: string): SafePromise<IncomingSecuritiesResult> => {
    const url = this.URL('rest/v3/fundamentals', {
      apikey: 'aH0FkLCohY5yxK6OEaJ28Zpv51Ze1GyY',
      symbols,
    });
    return this.debouncedGet(url, { credentials: 'same-origin' });
  };

  getCompany = (symbol: string): SafePromise<IncomingSecuritiesResult> => {
    const url = this.URL(`rest/v3/company/${symbol}`, {
      apikey: 'anBvLgmzgKHJhQdQQzBe24yKFpHwcBJN', //TODO: Do not use this API Key in production, change the KEY once be ready
    });
    return this.debouncedGet(url, { credentials: 'same-origin' });
  };
}
