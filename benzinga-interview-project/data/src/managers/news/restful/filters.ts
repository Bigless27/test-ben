import { SafePromise } from '@benzinga/safe-await';

import { RestfulClient } from '../../../utils';
import { ContentTypesForPro, IncomingCategoryResult } from '../ingress';

export class NewsFiltersRestful extends RestfulClient {
  public getContentTypes = (): SafePromise<ContentTypesForPro> => {
    const url = this.URL('ajax-cache/content-types-for-pro');
    return this.get(url, { credentials: 'same-origin' });
  };

  public getCategories = (): SafePromise<IncomingCategoryResult> => {
    const url = this.URL('services/watchlist/bzuser/channel');
    return this.get(url, { credentials: 'same-origin' });
  };
}
