import { SafeError, SafePromise, safeRace } from './safeAwait';
import { safeDelay, safeTimeout } from './safeTimings';

export type SafeResilientType<T, X, ErrorType extends string = string, ErrorData = unknown> =
  | {
      err?: null;
      isErrorResult?: X;
      result: T;
    }
  | {
      err: SafeError<ErrorType, ErrorData>;
      isErrorResult?: undefined;
      result?: undefined;
    };

export type SafeResilientPromise<T, X, ErrorType extends string = string, ErrorData = unknown> = Promise<
  SafeResilientType<T, X, ErrorType, ErrorData>
>;

export interface SafeResilientParams<U, O> {
  delayFirstAttempt?: boolean;
  delayMultiple?: number;
  delayOffset?: number;
  isError?: (result: U | undefined) => SafePromise<O>;
  maxDelay?: number;
  maxNumOfAttempts?: number;
  retryDelay?: number;
  retryOnError?: boolean;
  timeoutLength?: number;
}

interface SafeResilientRecurParams<U, O>
  extends Required<Pick<SafeResilientParams<U, O>, Exclude<keyof SafeResilientParams<U, O>, 'isError'>>> {
  isError?: (result: U | undefined) => SafePromise<O>;
  numOfAttempts: number;
  previousRequests: SafePromise<U>[];
}

export const safeResilient = <U, T extends Array<unknown>, X>(
  func: (...args: T) => SafePromise<U>,
  params?: SafeResilientParams<U, X>,
): ((...args: T) => SafeResilientPromise<U, X>) => {
  return async <O extends U = U>(...args: T): SafeResilientPromise<O, X> => {
    const retry = async (params: SafeResilientRecurParams<U, X>): SafeResilientPromise<O, X> => {
      if (params.numOfAttempts <= params.maxNumOfAttempts) {
        await safeDelay(params.retryDelay);
        return recur(params, ...args);
      } else {
        return { err: new SafeError('max number of attempt has been reached', 'maxRetries') };
      }
    };

    const recur = async (params: SafeResilientRecurParams<U, X>, ...args: T): SafeResilientPromise<O, X> => {
      const request = func(...args);
      const value = await safeTimeout(safeRace([request, ...params.previousRequests]), params.timeoutLength);

      if (value.err) {
        if (value.err.type === 'timeout' || params.retryOnError) {
          // timeout or err;
          return retry(incrementParams(params, request, value.err.type !== 'timeout'));
        } else {
          return { err: value.err };
        }
      } else if (params.isError) {
        const isErrorValue = await params.isError?.(value.result);
        if (isErrorValue.err) {
          return retry(incrementParams(params, request, false));
        } else {
          return { err: isErrorValue.err, isErrorResult: isErrorValue.result, result: value.result as O };
        }
      }
      return { result: value.result as O };
    };
    const recurParams = initParams<U, X>(params);
    if (recurParams.delayFirstAttempt) {
      await safeDelay(recurParams.retryDelay);
    }
    return recur(recurParams, ...args);
  };
};

const initParams = <U, O>(params?: SafeResilientParams<U, O>): SafeResilientRecurParams<U, O> => {
  return {
    delayFirstAttempt: false,
    delayMultiple: 2,
    delayOffset: 0,
    isError: undefined,
    maxDelay: 120000, // two mins
    maxNumOfAttempts: Infinity,
    numOfAttempts: 0,
    previousRequests: [],
    retryDelay: 100,
    retryOnError: true,
    timeoutLength: 60000, // one min
    ...params,
  };
};

const incrementParams = <U, O>(
  params: SafeResilientRecurParams<U, O>,
  request: SafePromise<U>,
  isTimeout: boolean,
): SafeResilientRecurParams<U, O> => {
  let newRetryDelay = params.retryDelay * params.delayMultiple + params.delayOffset;
  if (newRetryDelay > params.maxDelay) {
    newRetryDelay = params.maxDelay;
  } else if (params.numOfAttempts === 0 && params.delayFirstAttempt === false) {
    newRetryDelay = params.retryDelay;
  }
  return {
    ...params,
    numOfAttempts: params.numOfAttempts + 1,
    previousRequests: isTimeout ? [request, ...params.previousRequests] : params.previousRequests,
    retryDelay: newRetryDelay,
  };
};
