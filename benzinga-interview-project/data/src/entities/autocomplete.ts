import { StockSymbol, TagType } from '.';

enum ErrorType {
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  INVALID_SYMBOLS = 'INVALID_SYMBOLS',
  TOO_MANY_SYMBOLS = 'TOO_MANY_SYMBOLS',
  UNABLE_TO_CONNECT = 'UNABLE_TO_CONNECT',
}

type ErrorTypes = {
  [type in ErrorType]: string;
};

export const errorTypes: ErrorTypes = {
  // Unable to parse the JSON from the API
  [ErrorType.INVALID_RESPONSE]: 'Unable to parse search results',

  // Some symbols passed to us via paste/csv were not found in the data api.
  [ErrorType.INVALID_SYMBOLS]: 'Invalid Symbols passed',

  // Too many symbols were added
  [ErrorType.TOO_MANY_SYMBOLS]: 'Too many symbols imported',

  // Could not connect to the data api
  [ErrorType.UNABLE_TO_CONNECT]: 'Unable to connect to server',
};

export interface AutocompleteSymbol {
  currency: string;
  error?: {
    code: number;
    message: string;
  };
  exchange: string;
  name: string;
  shortName: string;
  symbol: string;
  type: TagType.Symbol;
}

export type AutocompleteKeyword = string;

export interface AutocompleteFund {
  cik: string;
  name: string;
}

export enum KeyboardKey {
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  ArrowUp = 'ArrowUp',
  Backspace = 'Backspace',
  Comma = ',',
  Enter = 'Enter',
}

export const COMPLETION_KEYS = [KeyboardKey.Enter, KeyboardKey.Comma];

export const MAX_SYMBOLS_LIMIT = 500;

export interface AutocompleteItem {
  heading?: string;
  label?: string;
  name: string;
  tagId: string;
  type: TagType;
}

export interface KeywordSearchItem extends AutocompleteItem {
  type: TagType.Keyword;
}

export interface SymbolSearchItem extends AutocompleteItem {
  type: TagType.Symbol;
}

export interface FundSearchItem extends AutocompleteItem {
  type: TagType.Fund;
}

export type AutocompleteSymbolResult = {
  [stockSymbol in StockSymbol]: AutocompleteSymbol;
};

export interface SearchError {
  message: string;
  searchTerm: string;
}

export interface TagsWithSource {
  source: string;
  tags: string[];
}

export interface JSONWithSource<T> {
  json: T;
  source: string;
}
