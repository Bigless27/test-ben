import { SafeType } from '.';
import { safeAwaitFunction, SafeError, SafePromise, safeThen, safeAwait } from './safeAwait';
import { safeResilient, SafeResilientParams, SafeResilientPromise } from './safeResilient';
import { safeTimeout } from './safeTimings';

const safeFetchStatic = safeAwaitFunction(fetch);

export const safeFetch = async (input: RequestInfo, init?: TimeoutableRequestInit): SafePromise<Response> => {
  // create request
  let fetchReq = safeFetchStatic(input, init);
  if (init?.timeout !== undefined && init?.timeout !== null) {
    fetchReq = safeTimeout(fetchReq, init.timeout);
  }

  const result = await fetchReq;
  const { result: response } = result;
  if (response && response.status >= 400 && response.status < 600) {
    return { err: new SafeError(`request returned ${response.status}`, 'response', response) };
  }
  return result;
};

interface ResilientRequestInit<T> extends RequestInit {
  resilience?: SafeResilientParams<Response, T>;
}

export const safeResilientFetch = async <T = Response>(
  input: RequestInfo,
  init?: ResilientRequestInit<T>,
): SafeResilientPromise<Response, T> => {
  const fetchRequestRetry = safeResilient(safeFetchStatic, {
    ...init?.resilience,
    isError: (response: Response | undefined): SafePromise<T | undefined> => {
      if (response === undefined) {
        return Promise.resolve({ err: new SafeError('no response given', 'response', response) });
      } else if (response.status >= 500 && response.status < 600) {
        return Promise.resolve({ err: new SafeError('server side error', 'response', response) });
      } else {
        return init?.resilience?.isError?.(response) ?? Promise.resolve({ result: undefined });
      }
    },
  });

  const value = await fetchRequestRetry(input, init);
  const { result: response } = value;
  if (response && response.status >= 400 && response.status < 600) {
    return { err: new SafeError(`request returned ${response.status}`, 'response', response) };
  }
  return value;
};

/**
  all this function does is convert type HeadersInit = Headers | string[][] | Record<string, string> to Header
 */
export const genHeaders = (headers?: HeadersInit): Headers => {
  let newHeaders = new Headers();

  if (headers) {
    if (headers instanceof Headers) {
      newHeaders = headers;
    } else if (Array.isArray(headers)) {
      newHeaders = headers.reduce<Headers>((acc, val) => {
        acc.append(val[0], val[1]);
        return acc;
      }, newHeaders);
    } else if (typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        newHeaders.append(key, value);
      });
    }
  }
  return newHeaders;
};

export const safeJson = async <T>(res: Response): SafePromise<T> => {
  return await safeAwait<T>(res.json());
};

const JsonHeaderHelper = (init: RequestInit = {}) => {
  // init headers
  init.headers = genHeaders(init.headers);
  if (!init.headers.has('accept')) {
    init.headers.append('accept', 'application/json');
  }
  if (
    (init.method === 'POST' || init.method === 'PUT' || init.method === 'PATCH') &&
    !init.headers.has('content-type')
  ) {
    init.headers.append('content-type', 'application/json');
  }
  return init;
};

export const safeJsonFetch = async <T>(input: RequestInfo, init?: TimeoutableRequestInit): SafePromise<T> => {
  const value = await safeFetch(input, JsonHeaderHelper(init));
  if (value.err) {
    return value;
  } else {
    return safeJson(value.result);
  }
};

interface ResilientJsonRequestInit<T, X> extends RequestInit {
  resilience?: SafeResilientParams<T, X>;
}

export const safeJsonResilientFetch = async <T>(
  input: RequestInfo,
  init?: ResilientJsonRequestInit<T, unknown>,
): SafePromise<T> => {
  const newInit: ResilientRequestInit<T> = {
    ...JsonHeaderHelper(init),
    resilience: {
      ...init?.resilience,
      isError: async (response: Response | undefined): SafePromise<T> => {
        if (response === undefined) {
          return Promise.resolve({ err: new SafeError('no response given', 'response', response) });
        } else {
          const value = await safeJson<T>(response);
          if (init?.resilience?.isError) {
            return safeThen(init?.resilience?.isError?.(value.result), () => value);
          }
          return value;
        }
      },
    },
  };
  const { err, isErrorResult } = await safeResilientFetch(input, newInit);
  return { err, result: isErrorResult } as SafeType<T>;
};

export interface TimeoutableRequestInit extends RequestInit {
  timeout?: number | null;
}
