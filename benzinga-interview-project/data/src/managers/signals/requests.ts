import { SafePromise } from '@benzinga/safe-await';

import { RestfulClient } from '../../utils';
import { Signal, SignalsScreenerFilter, SignalType } from './entities';
import { generateSignalsParams } from './generateParams';

export class SignalsRequest extends RestfulClient {
  getSignals = (
    selectedSignalTypes: SignalType[],
    screenerFilters: SignalsScreenerFilter[],
  ): SafePromise<{ signals?: Signal[] }> => {
    const url = this.URL('signals', generateSignalsParams(selectedSignalTypes, screenerFilters));
    return this.get(url, { credentials: `same-origin` });
  };
}
