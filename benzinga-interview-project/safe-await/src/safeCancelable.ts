import { SafePromise } from './safeAwait';

type SafePromiseCancelableType<T> =
  | { canceled: boolean; err: Error; result?: undefined }
  | { canceled: boolean; err?: null; result: T };

export type SafePromiseCancelable<T> = Promise<SafePromiseCancelableType<T>>;

export const safeCancelable = <T>(promise: SafePromise<T>): [SafePromiseCancelable<T>, () => void] => {
  let canceled = false;

  const makeCancelable = async (): SafePromiseCancelable<T> => {
    return { canceled, ...(await promise) };
  };

  return [makeCancelable(), () => (canceled = true)];
};
