/**
 *
 * @returns true if argument is object, null is excluded
 */

export const isObject = (item: unknown): item is Record<string | number | symbol, unknown> => {
  return item !== null && typeof item === 'object';
};

/**
 * @returns true if argument is array
 */
export const isArray = (item: unknown): item is unknown[] => {
  return Array.isArray(item);
};

/**
 * @returns true if argument is string
 */
export const isString = (item: unknown): item is string => {
  return typeof item === 'string' || item instanceof String;
};

/**
 * Compares two arrays or objects and returns true if they are equal
 *
 * @remarks
 * This function can be used to compare both arrays and objects with primitive and complex values
 *
 * @param object1 - an object or array with all value types allowed
 * @param object2 - an object or array with all value types allowed
 *
 * @returns true if objects are deep equal
 */
export const deepEqual = <T extends unknown>(val1: T, val2: T): boolean => {
  if (isArray(val1) && isArray(val2)) {
    return arrayDeepEqual(val1, val2);
  } else if (isObject(val1) && isObject(val2)) {
    return deepEqualObject(val1 as Record<keyof T, T[keyof T]>, val2);
  } else {
    return val1 === val2;
  }
};

/**
 * Compares two objects and returns true if they are equal
 *
 * @remarks
 * This function can be used to compare objects with primitive values
 *
 * @param object1 - an object with primitive values allowed
 * @param object2 - an object with primitive values allowed
 *
 * @returns true if objects are deep equal
 */
export const shallowEqualObject = <T extends Record<keyof T, T[keyof T]>>(object1: T, object2: T): boolean => {
  const keys1 = Object.keys(object1) as (keyof T)[];
  const keys2 = Object.keys(object2) as (keyof T)[];

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key => object1[key] === object2[key]);
};

/**
 * Compares two objects and returns true if they are equal
 *
 * @remarks
 * This function can be used to compare objects with primitive and complex values alike
 *
 * @param object1 - an object with all value types allowed
 * @param object2 - an object with all value types allowed
 *
 * @returns true if objects are deep equal
 */
export const deepEqualObject = <T extends Record<keyof T, T[keyof T]>>(object1: T, object2: T): boolean => {
  const keys1 = Object.keys(object1) as (keyof T)[];
  const keys2 = Object.keys(object2) as (keyof T)[];

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key => {
    const val1 = object1[key];
    const val2 = object2[key];
    return deepEqual(val1, val2);
  });
};

/**
 * Compares two arrays and returns true if they are equal
 *
 * @remarks
 * This function should be used to compare arrays with primitive values only
 *
 * @param array1 - an array of primitive values
 * @param array2 - an array of primitive values
 *
 * @returns true if arrays have shallow equality
 */
export const arrayShallowEqual = <T extends unknown[]>(array1: T, array2: T): boolean => {
  return array1.every((val1, index) => {
    const val2 = array2[index];
    return deepEqual(val1, val2);
  });
};

export const arrayDeepEqual = <T extends unknown[]>(array1: T, array2: T): boolean => {
  return array1.every((val1, index) => {
    const val2 = array2[index];
    return deepEqual(val1, val2);
  });
};
