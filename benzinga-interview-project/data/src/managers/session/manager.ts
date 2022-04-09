import { Subscribable, Subscription } from '@benzinga/subscribable';
import { ENV, Environments } from '../../env';

import { AuthenticationManager, AuthenticationManagerEvent } from '../authentication';
import { CalendarManager, CalendarManagerEvent } from '../calendar';
import { ChatManager, ChatManagerEvent } from '../chat';
import { NewsManager, NewsManagerEvent } from '../news';
import { NotesManager, NotesManagerEvent } from '../notes';
import { QuotesManager, QuotesManagerEvent } from '../quotes';
import { SecuritiesManager, SecuritiesManagerEvent } from '../securities';
import { SignalsManager, SignalsManagerEvent } from '../signals';
import { WatchlistManager, WatchlistManagerEvent } from '../watchlist';

export interface ManagersMapping {
  authentication: AuthenticationManager;
  calendar: CalendarManager;
  chat: ChatManager;
  news: NewsManager;
  notes: NotesManager;
  quotes: QuotesManager;
  securities: SecuritiesManager;
  signals: SignalsManager;
  watchlist: WatchlistManager;
}

type ValueOf<T> = T[keyof T];

export type ManagersName = keyof ManagersMapping;
type Managers = ValueOf<ManagersMapping>;

type SessionManagerEvents =
  | AuthenticationManagerEvent
  | CalendarManagerEvent
  | ChatManagerEvent
  | NewsManagerEvent
  | NotesManagerEvent
  | QuotesManagerEvent
  | SecuritiesManagerEvent
  | SignalsManagerEvent
  | WatchlistManagerEvent;

export class SessionManager extends Subscribable<SessionManagerEvents> {
  private urls: Environments;
  private managers = new Map<ManagersName, Managers>();
  private subscriptions?: Subscription<Managers>[];

  constructor(urls?: Partial<Environments>) {
    super();
    // prettier-ignore
    this.urls = {
      /* eslint-disable prettier/prettier */
      AUTHENTICATION_RESTFUL_URL: SessionManager.GenURL(urls?.AUTHENTICATION_RESTFUL_URL, () => window?.env?.IAM_ROOT,              ENV.prod.AUTHENTICATION_RESTFUL_URL),
      CALENDAR_RESTFUL_URL:       SessionManager.GenURL(urls?.CALENDAR_RESTFUL_URL,       () => window?.env?.API_ROOT,              ENV.prod.CALENDAR_RESTFUL_URL),
      CHAT_RESTFUL_URL:           SessionManager.GenURL(urls?.CHAT_RESTFUL_URL,           () => window?.env?.IAM_ROOT,              ENV.prod.CHAT_RESTFUL_URL),
      NEWS_RESTFUL_URL:           SessionManager.GenURL(urls?.NEWS_RESTFUL_URL,           () => window?.env?.SERVICES_ROOT,         ENV.prod.NEWS_RESTFUL_URL),
      NEWS_SOCKET_URL:            SessionManager.GenURL(urls?.NEWS_SOCKET_URL,            () => window?.env?.ADV_NEWSFEED_URL,      ENV.prod.NEWS_SOCKET_URL),
      NOTES_RESTFUL_URL:          SessionManager.GenURL(urls?.NOTES_RESTFUL_URL,          () => window?.env?.IAM_ROOT,              ENV.prod.NOTES_RESTFUL_URL),
      QUOTES_RESTFUL_URL:         SessionManager.GenURL(urls?.QUOTES_RESTFUL_URL,         () => window?.env?.DATAAPI_ROOT,          ENV.prod.QUOTES_RESTFUL_URL),
      QUOTES_SOCKET_URL:          SessionManager.GenURL(urls?.QUOTES_SOCKET_URL,          () => window?.env?.QUOTE_ADDR,            ENV.prod.QUOTES_SOCKET_URL),
      SECURITIES_RESTFUL_URL:     SessionManager.GenURL(urls?.SECURITIES_RESTFUL_URL,     () => window?.env?.DATAAPI_ROOT,          ENV.prod.SECURITIES_RESTFUL_URL),
      SIGNALS_RESTFUL_URL:        SessionManager.GenURL(urls?.SIGNALS_RESTFUL_URL,        () => window?.env?.SIGNALS_RESTFUL_ADDR,  ENV.prod.SIGNALS_RESTFUL_URL),
      SIGNALS_SOCKET_URL:         SessionManager.GenURL(urls?.SIGNALS_SOCKET_URL,         () => window?.env?.SIGNALS_SOCKET_ADDR,   ENV.prod.SIGNALS_SOCKET_URL),
      WATCHLIST_RESTFUL_URL:      SessionManager.GenURL(urls?.WATCHLIST_RESTFUL_URL,      () => window?.env?.SERVICES_ROOT,         ENV.prod.WATCHLIST_RESTFUL_URL),
      /* eslint-enable prettier/prettier */
    };
  }

  private static GenURL = (userUrl: URL | undefined, envURL: () => string | undefined, defaultUrl: URL): URL => {
    if (userUrl) {
      return userUrl;
      // the following is for nextjs since it wont have window defined
    } else if (typeof window !== 'undefined') {
      const url = envURL();
      if (url) {
        return new URL(url);
      }
    }
    return defaultUrl;
  };

  public getManager = <T extends ManagersName>(managerName: T): ManagersMapping[T] => {
    let manager = this.managers.get(managerName);
    if (manager === undefined) {
      switch (managerName) {
        case 'authentication': {
          const restfulUrl = this.urls.AUTHENTICATION_RESTFUL_URL;
          manager = new AuthenticationManager(restfulUrl, this);
          break;
        }
        case 'calendar': {
          const restfulUrl = this.urls.CALENDAR_RESTFUL_URL;
          manager = new CalendarManager(restfulUrl, this);
          break;
        }
        case 'chat': {
          const restfulUrl = this.urls.CHAT_RESTFUL_URL;
          manager = new ChatManager(restfulUrl, this);
          break;
        }
        case 'news': {
          const restfulUrl = this.urls.NEWS_RESTFUL_URL;
          const socketUrl = this.urls.NEWS_SOCKET_URL;
          manager = new NewsManager(restfulUrl, socketUrl, this);
          break;
        }
        case 'notes': {
          const restfulUrl = this.urls.NOTES_RESTFUL_URL;
          manager = new NotesManager(restfulUrl, this);
          break;
        }
        case 'quotes': {
          const restfulUrl = this.urls.QUOTES_RESTFUL_URL;
          const socketUrl = this.urls.QUOTES_SOCKET_URL;
          manager = new QuotesManager(restfulUrl, socketUrl, this);
          break;
        }
        case 'securities': {
          const restfulUrl = this.urls.SECURITIES_RESTFUL_URL;
          manager = new SecuritiesManager(restfulUrl, this);
          break;
        }
        case 'signals': {
          const restfulUrl = this.urls.SIGNALS_RESTFUL_URL;
          const socketUrl = this.urls.SIGNALS_SOCKET_URL;
          manager = new SignalsManager(restfulUrl, socketUrl, this);
          break;
        }
        case 'watchlist': {
          const restfulUrl = this.urls.WATCHLIST_RESTFUL_URL;
          manager = new WatchlistManager(restfulUrl, this);
          break;
        }
        default: {
          throw 'the requested manager does not exist. we should never get here.';
        }
      }
      if (this.subscriptions !== undefined) {
        this.subscriptions?.push(manager.subscribe((event: SessionManagerEvents) => this.call(event)));
      }
      this.managers.set(managerName, manager);
    }
    console.debug('Managers Map entries', this.managers.entries());
    return manager as ManagersMapping[T];
  };

  protected onFirstSubscription = (): void => {
    this.subscriptions = [];
    this.managers.forEach(manager =>
      this.subscriptions?.push(manager.subscribe((event: SessionManagerEvents) => this.call(event))),
    );
  };

  protected onZeroSubscriptions = (): void => {
    this.subscriptions?.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  };
}
