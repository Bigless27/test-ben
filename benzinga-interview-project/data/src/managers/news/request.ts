import { SafeError, SafePromise } from '@benzinga/safe-await';
import { Subscribable } from '@benzinga/subscribable';
import { Category } from './entities';
import { NewsFiltersRestful } from './restful/filters';
import { ContentTypesForPro, ingresCategory } from './ingress';
import { SessionManager } from '../session';

interface NewsRequestErrorEvent {
  error: SafeError;
  errorType: 'get_category_error' | 'get_content_types_error' | 'get_content_type_missing_promise_error';
  type: 'error';
}

interface NewsCategoriesEvent {
  categories: Category[];
  type: 'categories';
}

interface NewsContentTypeEvent {
  contextTypes: ContentTypesForPro;
  type: 'context_types';
}

export type NewsRequestEvent = NewsRequestErrorEvent | NewsCategoriesEvent | NewsContentTypeEvent;

export type NewsRequestSubscription = ReturnType<NewsRequest['subscribe']>;

export class NewsRequest extends Subscribable<NewsRequestEvent> {
  private requestFilters: NewsFiltersRestful;
  private contextTypePromise?: SafePromise<ContentTypesForPro>;
  private isContextTypeFulfilled = false;

  constructor(filtersUrl: URL, session: SessionManager) {
    super();
    this.requestFilters = new NewsFiltersRestful(filtersUrl, session, { 'x-device-key': true });
  }

  public getCategories = async (): SafePromise<Category[]> => {
    const categories = await ingresCategory(this.requestFilters.getCategories());
    if (categories.err) {
      this.call({ error: categories.err, errorType: 'get_category_error', type: 'error' });
      return categories;
    } else {
      this.call({ categories: categories.result, type: 'categories' });
      return categories;
    }
  };

  public getContentTypes = async (): SafePromise<ContentTypesForPro> => {
    // this was a simple way to make sure multiple calls did not occure on the same endpoint
    if (this.isContextTypeFulfilled === false) {
      this.contextTypePromise = this.requestFilters.getContentTypes();
      this.isContextTypeFulfilled = true;
    }
    if (this.contextTypePromise) {
      const contextTypes = await this.contextTypePromise;
      this.isContextTypeFulfilled = false;
      if (contextTypes.err) {
        this.call({ error: contextTypes.err, errorType: 'get_content_types_error', type: 'error' });
        return contextTypes;
      } else {
        this.call({ contextTypes: contextTypes.result, type: 'context_types' });
        return contextTypes;
      }
    } else {
      const error = new SafeError('contextType promise is missing', 'undefined_return');
      this.call({ error, errorType: 'get_content_type_missing_promise_error', type: 'error' });
      return { err: error };
    }
  };
}
