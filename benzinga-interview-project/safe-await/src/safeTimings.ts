import { SafeError, SafePromise, safeAwait } from './safeAwait';

export const safeTimeout = <T>(promise: SafePromise<T>, timeoutInMilliseconds: number): SafePromise<T> => {
  return Promise.race([
    promise,
    safeAwait<T>(
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new SafeError<'timeout'>('the promise has not finished in the requested time', 'timeout')),
          timeoutInMilliseconds,
        ),
      ),
    ),
  ]);
};

export const safeDelay = (timeoutInMilliseconds: number): SafePromise<undefined> => {
  return safeAwait(new Promise(response => setTimeout(() => response(undefined), timeoutInMilliseconds)));
};
