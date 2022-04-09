import { SafePromise } from '@benzinga/safe-await';
import { SessionManager } from '../managers';
import { IncludeHeader, safeDataFetch, safeJsonDataFetch, DataRequestInit } from './safeDataFetch';
/*
 * apiKey set to undefined means don't set header
 * deviceToken set to null means try to get value for cookie while undefined means don't set header
 */
export class RestfulClient {
  protected hostname: URL;
  private sessionManager: SessionManager;
  private includeHeader?: IncludeHeader;
  private debouncedGetRequest = new Map<string, SafePromise<unknown>>();

  constructor(hostname: URL, sessionManager: SessionManager, includeHeader?: IncludeHeader) {
    this.includeHeader = includeHeader;
    this.hostname = hostname;
    this.sessionManager = sessionManager;
  }

  static AddParamsToURL = (url: URL, params: Record<string, string | number | boolean | null | undefined>): URL => {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, `${value}`);
      }
    });
    return url;
  };

  static ExtendPathname = (url: URL, pathname: string): URL => {
    return new URL(pathname, url);
  };

  static ExtendPathnameAddParamsToURL = (
    url: URL,
    pathname: string,
    params: Record<string, string | number | boolean | null | undefined>,
  ): URL => {
    url = RestfulClient.ExtendPathname(url, pathname);
    url = RestfulClient.AddParamsToURL(url, params);
    return url;
  };

  protected URL = (pathname: string, params?: Record<string, string | number | boolean | null | undefined>): URL => {
    const url = RestfulClient.ExtendPathname(this.hostname, pathname);
    if (params) {
      return RestfulClient.AddParamsToURL(url, params);
    } else {
      return url;
    }
  };

  protected jsonFetch = <T extends unknown>(
    input: RequestInfo,
    init: Partial<DataRequestInit> = {},
  ): SafePromise<T> => {
    return safeJsonDataFetch<T>(input, {
      includeHeader: this.includeHeader,
      session: this.sessionManager.getManager('authentication'),
      ...init,
    });
  };

  protected fetch = (input: RequestInfo, init: Partial<DataRequestInit> = {}): SafePromise<Response> => {
    return safeDataFetch(input, {
      includeHeader: this.includeHeader,
      session: this.sessionManager.getManager('authentication'),
      ...init,
    });
  };

  protected get = <T extends unknown>(input: URL, init: Partial<DataRequestInit> = {}): SafePromise<T> => {
    init.method = 'GET';
    return this.jsonFetch(input.toString(), init);
  };

  protected debouncedGet = async <T extends unknown>(
    input: URL,
    init: Partial<DataRequestInit> = {},
  ): SafePromise<T> => {
    init.method = 'GET';
    const url = input.toString();
    if (this.debouncedGetRequest.has(url)) {
      return this.debouncedGetRequest.get(url) as SafePromise<T>;
    } else {
      const response = this.jsonFetch(input.toString(), init) as SafePromise<T>;
      this.debouncedGetRequest.set(url, response);
      await response;
      this.debouncedGetRequest.delete(url);
      return response;
    }
  };

  protected post = <T extends unknown, BODY extends Record<keyof BODY, unknown>>(
    input: URL,
    body?: BODY,
    init: Partial<DataRequestInit> = {},
  ): SafePromise<T> => {
    init.method = 'POST';
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return this.jsonFetch(input.toString(), init);
  };

  protected put = <T extends unknown, BODY extends Record<keyof BODY, unknown>>(
    input: URL,
    body?: BODY,
    init: Partial<DataRequestInit> = {},
  ): SafePromise<T> => {
    init.method = 'PUT';
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return this.jsonFetch(input.toString(), init);
  };

  protected patch = <T extends unknown, BODY extends Partial<T>>(
    input: URL,
    body?: BODY,
    init: Partial<DataRequestInit> = {},
  ): SafePromise<T> => {
    init.method = 'PATCH';
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return this.jsonFetch(input.toString(), init);
  };

  protected delete = (input: URL, init: Partial<DataRequestInit> = {}): SafePromise<Response> => {
    init.method = 'DELETE';
    return this.fetch(input.toString(), init);
  };
}
