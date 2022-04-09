import {
  genHeaders,
  SafeError,
  safeFetch,
  safeJsonFetch,
  SafePromise,
  TimeoutableRequestInit,
} from '@benzinga/safe-await';
import { Authentication } from '../managers/authentication/entities';

export interface IncludeHeader {
  authorization?: boolean;
  'x-device-key'?: boolean;
}
export interface DataRequestInit extends TimeoutableRequestInit {
  allowsAnonymousAuth?: boolean;
  includeHeader?: IncludeHeader;
  session: {
    getBenzingaToken: () => string | undefined;
    getSession?: () => SafePromise<Authentication>;
  };
}

const initFetch = async (
  init: DataRequestInit = { session: { getBenzingaToken: () => undefined } },
): SafePromise<DataRequestInit> => {
  init.headers = genHeaders(init.headers);
  init.credentials = init.credentials ?? 'include';

  let authToken = init.session.getBenzingaToken();
  if (authToken === undefined && init.session.getSession) {
    await init.session.getSession();
    authToken = init.session.getBenzingaToken();
  }
  if ((init.allowsAnonymousAuth ?? false) === false && authToken === undefined) {
    // the reason for this is because chrome likes to show a sign in promp if a request returns a 401
    // while having credentials include or auth header
    return { err: new SafeError('must be logged in to call this endpoint', 'auth_required') };
  }
  if (init.includeHeader?.['x-device-key'] && authToken) {
    init.headers.set('x-device-key', authToken);
  }
  if (init.includeHeader?.['authorization'] && authToken) {
    init.headers.set('authorization', authToken);
  }

  return { result: init };
};

export const safeJsonDataFetch = async <T extends unknown>(
  input: RequestInfo,
  init: DataRequestInit = { session: { getBenzingaToken: () => undefined } },
): SafePromise<T> => {
  const initializedConfig = await initFetch(init);
  if (initializedConfig.err) {
    return initializedConfig;
  }
  return safeJsonFetch<T>(input, initializedConfig.result);
};

export const safeDataFetch = async (
  input: RequestInfo,
  init: DataRequestInit = { session: { getBenzingaToken: () => undefined } },
): SafePromise<Response> => {
  const initializedConfig = await initFetch(init);
  if (initializedConfig.err) {
    return initializedConfig;
  }
  return safeFetch(input, initializedConfig.result);
};
