import { SafeType } from './safeAwait';

export const safeJsonParse = <T>(str: string): SafeType<T> => {
  try {
    return { result: JSON.parse(str) };
  } catch (err) {
    return { err };
  }
};
