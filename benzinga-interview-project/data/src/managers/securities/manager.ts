import { SafePromise } from '@benzinga/safe-await';
import { ExtendedSubscribable, Subscription } from '@benzinga/subscribable';

import { Financials } from './entities';
import { SecuritiesRequest, FinancialsRequestEvent } from './request';
import { SecuritiesStore } from './store';
import { SessionManager } from '../session';

interface SecuritiesFunctions {
  getFinancials: SecuritiesManager['getFinancials'];
}

export type SecuritiesManagerEvent = FinancialsRequestEvent;

export class SecuritiesManager extends ExtendedSubscribable<FinancialsRequestEvent, SecuritiesFunctions> {
  private store: SecuritiesStore;
  private request: SecuritiesRequest;
  private requestSubscription?: Subscription<SecuritiesRequest>;

  constructor(restfulURL: URL, session: SessionManager) {
    super();
    this.request = new SecuritiesRequest(restfulURL, session);
    this.store = new SecuritiesStore();
  }

  public static compareFinancials = (lhs: Financials[], rhs: Financials[]): boolean => {
    return lhs?.every(financial => {
      const newFinancial = rhs.find(newFinancial => financial.id === newFinancial.id);
      if (newFinancial) {
        return financial.id === newFinancial.id;
      } else {
        return false;
      }
    });
  };

  public getFinancials = async (symbols?: string): SafePromise<Financials[]> => {
    if (this.store.getFinancials() === undefined) {
      const financials = await this.request.getFinancials(symbols);
      if (financials.result) {
        if (this.store.setFinancials(financials.result)) {
          this.call({
            financials: financials.result,
            type: 'financials_updated',
          });
        }
      }
      return financials;
    } else {
      return { result: this.store.getFinancials() ?? [] };
    }
  };

  protected onSubscribe = (): SecuritiesFunctions => ({
    getFinancials: this.getFinancials,
  });

  protected onFirstSubscription = (): void => {
    this.requestSubscription = this.request.subscribe(event => this.call(event));
  };

  protected onZeroSubscriptions = (): void => {
    this.requestSubscription?.unsubscribe();
  };
}
