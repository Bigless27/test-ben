export type AuthKey = string;
export type HexColor = string;
export type ISO8601 = string; // e.g. "2017-11-03T13:17:03Z"

/*
 * UnixTime in Seconds
 */
export type UnixTimestamp = string;
export type JSONString = string;
export type MECSSectorCode = string; // a string that starts with "MECS:" e.g. "MECS:201"
export type Milliseconds = number;
export type Seconds = number;
export type StringNumber = string; // a string that only contains numbers
export type URLString = string;

/*
 * system
 */
export interface Params {
  [key: string]: string | number | boolean | undefined | null;
}
