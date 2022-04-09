export class SafeError<TYPE extends string = string, DATA = unknown> extends Error {
  public type: TYPE;
  public data: DATA | undefined;

  constructor(message: string, type: TYPE, data?: DATA) {
    super(message);
    this.type = type;
    this.data = data;
  }
}

export type SafeType<T, ErrorType extends string = string, ErrorData = unknown> =
  | { err?: undefined; result: T }
  | { err: SafeError<ErrorType, ErrorData>; result?: undefined };

export type SafePromise<T, ErrorType extends string = string, ErrorData = unknown> = Promise<
  SafeType<T, ErrorType, ErrorData>
>;

export type SafeMultiErrorType<T, ErrorType extends string = string, ErrorData = unknown> =
  | { err?: undefined; result: T }
  | { err: Error[] | SafeError<ErrorType, ErrorData>[]; result?: undefined };

export type SafePromiseMultiError<T, ErrorType extends string = string, ErrorData = unknown> = Promise<
  SafeMultiErrorType<T, ErrorType, ErrorData>
>;

type AsyncFunction<T extends Array<unknown>, U> = (...args: T) => Promise<U>;

export const safeAwaitFunction = <T extends Array<unknown>, U>(
  asyncFunction: AsyncFunction<T, U>,
): ((...args: T) => SafePromise<U>) => {
  return async <O extends U = U>(...args: T): SafePromise<O> => {
    try {
      return { result: (await asyncFunction(...args)) as O };
    } catch (err) {
      return { err };
    }
  };
};

export const safeAwait = async <T>(promise: Promise<T>): SafePromise<T> => {
  try {
    return { result: await promise };
  } catch (err) {
    return { err };
  }
};

export const safeRace = <T>(promises: SafePromise<T>[]): SafePromise<T> => {
  return Promise.race(promises);
};

export const safeThen = async <U, T = unknown>(
  promise: SafePromise<T>,
  func: (arg: T) => SafeType<U> | SafePromise<U>,
): SafePromise<U> => {
  const value = await promise;
  if (value.err) {
    return value;
  } else {
    return func(value.result);
  }
};

export const safeAwaitAll = async <U, T extends readonly SafePromise<U>[]>(
  promise: T & SafePromise<U>[],
): SafePromiseMultiError<U[]> => {
  const result = await Promise.all(promise);
  return result.reduce<SafeMultiErrorType<U[]>>(
    (acc, value) => {
      if (value.err) {
        return { err: [...(acc.err ?? []), value.err] };
      } else if (acc.err) {
        return { err: acc.err };
      } else if (value.result) {
        return { result: [...acc.result, value.result] };
      } else {
        return { result: acc.result };
      }
    },
    { result: [] },
  );
};

export const safeCatch = async <T>(promise: SafePromise<T>, func: (arg: Error) => SafeType<T>): SafePromise<T> => {
  const value = await promise;
  if (value.err) {
    return func(value.err);
  } else {
    return value;
  }
};
