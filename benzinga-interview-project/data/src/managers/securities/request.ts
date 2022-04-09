import { SafeError, SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable } from '@benzinga/subscribable';

import { Financials } from './entities';
import { SecuritiesRestful } from './restful';
import { ingestSecurities } from './ingest';
import { SessionManager } from '../session';

interface ErrorEvent {
  error?: SafeError;
  errorType: 'get_financials_error';
  type: 'error';
}

interface FinancialsUpdateEvent {
  financials: Financials[];
  type: 'financials_updated' | 'financials_received';
}

export type FinancialsRequestEvent = ErrorEvent | FinancialsUpdateEvent;

interface SecuritiesFunctions {
  getFinancials: SecuritiesRequest['getFinancials'];
}

export class SecuritiesRequest extends ExtendedSubscribable<FinancialsRequestEvent, SecuritiesFunctions> {
  private restful: SecuritiesRestful;

  constructor(url: URL, session: SessionManager) {
    super();
    this.restful = new SecuritiesRestful(url, session);
  }

  public getFinancials = async (symbols?: string): SafePromise<Financials[]> => {
    const financials = await ingestSecurities(this.restful.getFinancials(symbols));
    if (financials.err) {
      this.call({
        error: financials.err,
        errorType: 'get_financials_error',
        type: 'error',
      });
    } else {
      this.call({
        financials: financials.result,
        type: 'financials_received',
      });
    }
    return financials;
  };

  protected onSubscribe = (): SecuritiesFunctions => ({
    getFinancials: this.getFinancials,
  });
}
