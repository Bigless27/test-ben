/**
 * RequireAtLeastOne\<\{a: number, b: number, c?: number\}, 'a' | 'b'\> === \{a: number, c?: number\} | \{b: number, c?: number\}
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * RequireAtLeastOne\<\{a: number, b: number, c?: number\}, 'a' | 'b'\> === \{a: number, b?: number, c?: number\} | \{a?: number, b: number, c?: number\}
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
/**
 * Optional\<\{a: number, b: number\}, 'a'\> === \{a?: number, b: number\}
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 *  Essential\<\{a?: number, b?: number\}, 'a'\> === \{a: number, b?: number\}
 */
export type Essential<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;

/**
 * Unpacked\<['1', '2', '3']\> === '1' | '2' | '3'
 */
export type UnpackedArray<T> = T extends (infer U)[] ? U : T;
