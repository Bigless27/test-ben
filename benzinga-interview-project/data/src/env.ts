export interface Environments {
  AUTHENTICATION_RESTFUL_URL: URL;
  CALENDAR_RESTFUL_URL: URL;
  CHAT_RESTFUL_URL: URL;
  NEWS_RESTFUL_URL: URL;
  NEWS_SOCKET_URL: URL;
  NOTES_RESTFUL_URL: URL;
  QUOTES_RESTFUL_URL: URL;
  QUOTES_SOCKET_URL: URL;
  SECURITIES_RESTFUL_URL: URL;
  SIGNALS_RESTFUL_URL: URL;
  SIGNALS_SOCKET_URL: URL;
  WATCHLIST_RESTFUL_URL: URL;
}

export const ENV: Record<string, Environments> = {
  dev: {
    AUTHENTICATION_RESTFUL_URL: new URL('https://accounts.zingbot.bz/'),
    CALENDAR_RESTFUL_URL: new URL('https://www.zingbot.bz/'),
    CHAT_RESTFUL_URL: new URL('https://accounts.zingbot.bz/'),
    NEWS_RESTFUL_URL: new URL('https://www.zingbot.bz/'),
    NEWS_SOCKET_URL: new URL('wss://api.zingbot.bz/api/v3/news/advanced/ws'),
    NOTES_RESTFUL_URL: new URL('https://accounts.zingbot.bz/'),
    QUOTES_RESTFUL_URL: new URL('https://data-api-pro.zingbot.bz/rest/'),
    QUOTES_SOCKET_URL: new URL('wss://pro-quote-v2.zingbot.bz/quote/'),
    SECURITIES_RESTFUL_URL: new URL('https://data-api-pro.benzinga.com/'),
    SIGNALS_RESTFUL_URL: new URL('https://signals.benzinga.io/signals/api/'),
    SIGNALS_SOCKET_URL: new URL('wss://signals.benzinga.io/signals/ws'),
    WATCHLIST_RESTFUL_URL: new URL('https://www.zingbot.bz/'),
  },
  prod: {
    AUTHENTICATION_RESTFUL_URL: new URL('https://accounts.benzinga.com/'),
    CALENDAR_RESTFUL_URL: new URL('https://www.benzinga.com/'),
    CHAT_RESTFUL_URL: new URL('https://accounts.benzinga.com/'),
    NEWS_RESTFUL_URL: new URL('https://www.benzinga.com/'),
    NEWS_SOCKET_URL: new URL('wss://api.benzinga.com/api/v3/news/advanced/ws'),
    NOTES_RESTFUL_URL: new URL('https://accounts.benzinga.com/'),
    QUOTES_RESTFUL_URL: new URL('https://data-api.benzinga.com'),
    QUOTES_SOCKET_URL: new URL('wss://pro-quote-v2.benzinga.com/quote/'),
    SECURITIES_RESTFUL_URL: new URL('https://data-api-pro.zingbot.bz/'),
    SIGNALS_RESTFUL_URL: new URL('https://signals.benzinga.io/signals/api/'),
    SIGNALS_SOCKET_URL: new URL('wss://signals.benzinga.io/signals/ws'),
    WATCHLIST_RESTFUL_URL: new URL('https://www.benzinga.com/'),
  },
};
