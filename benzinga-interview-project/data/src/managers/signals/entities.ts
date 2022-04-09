import { AutocompleteItem, ISO8601, Params, StockSymbol } from '../../entities';

export enum SignalsMessageType {
  authReq = 'AuthRequest',
  authRes = 'AuthResponse',
  feedRequest = 'FeedRequest',
  heartbeat = 'Heartbeat',
  signal = 'Signal',
}

export type ScreenerQueryString = string;

export interface SignalsFeedRequestMessage {
  id: number | null;
  payload: {
    screenerQuery: ScreenerQueryString;
    signalFilters: string[];
  };
  type: SignalsMessageType.feedRequest;
}

export interface SignalsHeartbeatMessage {
  id: number | null;
  payload: {
    time: number;
  };
  type: SignalsMessageType.heartbeat;
}

export interface SignalsSignalMessage {
  payload: Signal;
  type: SignalsMessageType.signal;
}

export interface SignalsAuthMessage {
  id: number;
  payload: {
    sessionId: string;
  };
  type: SignalsMessageType.authReq;
}

export interface SignalsAuthSuccessResponse {
  id: number;
  payload: {
    success: boolean;
  };
  type: SignalsMessageType.authRes;
}

export type SignalsResponse = SignalsAuthSuccessResponse | SignalsHeartbeatMessage | SignalsSignalMessage;

export enum SignalType {
  blockTrade = 'BLOCK_TRADE',
  dayHighSeries = 'DAY_HIGH_SERIES',
  dayLowSeries = 'DAY_LOW_SERIES',
  fiftyTwoWeekHigh = 'FTW_HIGH',
  fiftyTwoWeekLow = 'FTW_LOW',
  gap = 'GAP',
  haultResume = 'HALT_RESUME',
  high = 'NEW_HIGH',
  low = 'NEW_LOW',
  option = 'OPTION_ACTIVITY',
  spike = 'PRICE_SPIKE',
}

// Add SignalTypes here to add support for more upsell features
export const signalTypeToFeature = {
  [SignalType.option]: {
    action: 'bzpro/feature/use',
    resource: 'signals-options',
  },
};

interface BaseSignal {
  date: ISO8601;
  description: string;
  id: number;
  key: number;
  symbol: StockSymbol;
  type: SignalType;
}

export interface SpikeSignal extends BaseSignal {
  properties: {
    amount: string;
    percent: string; // in integer form, not fraction. e.g. 2.5 not 0.025
  };
  type: SignalType.spike;
}

export interface BlockTradeSignal extends BaseSignal {
  properties: {
    ask: string;
    bid: string;
    exchange: string;
    price: string;
    saleConditions: string;
    size: string;
  };
  type: SignalType.blockTrade;
}

export interface OptionActivitySignal extends BaseSignal {
  properties: {
    aggressorInd: string;
    costBasis: string;
    optionActivityType: 'SWEEP' | 'TRADE';
    sentiment: string;
  };
  type: SignalType.option;
}

export interface GapSignal extends BaseSignal {
  type: SignalType.gap;
}
export interface HaultResumeSignal extends BaseSignal {
  type: SignalType.haultResume;
}
export interface HighSignal extends BaseSignal {
  type: SignalType.high;
}
export interface LowSignal extends BaseSignal {
  type: SignalType.low;
}
export interface FiftyTwoWeekHighSignal extends BaseSignal {
  type: SignalType.fiftyTwoWeekHigh;
}
export interface FiftyTwoWeekLowSignal extends BaseSignal {
  type: SignalType.fiftyTwoWeekLow;
}
export interface DayHighSeriesSignal extends BaseSignal {
  type: SignalType.dayHighSeries;
}
export interface DayLowSeriesSignal extends BaseSignal {
  type: SignalType.dayLowSeries;
}

export type Signal =
  | BlockTradeSignal
  | DayHighSeriesSignal
  | DayLowSeriesSignal
  | FiftyTwoWeekHighSignal
  | FiftyTwoWeekLowSignal
  | GapSignal
  | HaultResumeSignal
  | HighSignal
  | LowSignal
  | OptionActivitySignal
  | SpikeSignal;

export enum SignalGroup {
  highs = 'highs',
  lows = 'lows',
}

export interface SignalGroupConfig {
  hue: number;
  label: string;
  type: SignalGroup;
}

export type SignalGroupConfigsById = {
  [signalGroup in SignalGroup]: SignalGroupConfig;
};

export interface SignalConfig {
  group?: SignalGroup;
  hue: number;
  label: string;
  type: SignalType;
}

/********************
 * SIGNALS SCREENER *
 ********************/

export enum ScreenerFieldType {
  multiselect = 'multipleselect',
  range = 'range',
  string = 'stringinput',
  symbol = 'symbol',
  watchlist = 'watchlist',
}

export type ScreenerField = MultiselectField | RangeField | StringField | SymbolField | WatchlistField;

export type SignalsScreenerFilter =
  | ScreenerMultiselectFilter
  | ScreenerRangeFilter
  | ScreenerStringFilter
  | ScreenerSymbolFilter
  | ScreenerWatchlistFilter;

export interface ScreenerStringFilter {
  fieldId: FieldId;
  operator: ScreenerStringOperator;
  parameter: ScreenerStringParameter;
  type: ScreenerFieldType.string;
}

export interface ScreenerRangeFilter {
  fieldId: FieldId;
  operator: ScreenerRangeOperator;
  parameter: ScreenerRangeParameter;
  type: ScreenerFieldType.range;
}

export interface ScreenerMultiselectFilter {
  fieldId: FieldId;
  operator: ScreenerMultiselectOperator;
  parameter: ScreenerMultiselectParameter;
  type: ScreenerFieldType.multiselect;
}

export interface ScreenerSymbolFilter {
  fieldId: FieldId;
  operator: ScreenerSymbolOperator;
  parameter: ScreenerSymbolParameter;
  type: ScreenerFieldType.symbol;
}

export interface ScreenerWatchlistFilter {
  fieldId: FieldId;
  operator: ScreenerWatchlistOperator;
  parameter: ScreenerWatchlistParameter;
  type: ScreenerFieldType.watchlist;
}

export enum ScreenerFieldCategory {
  assetClassification = 'assetClassification',
  fundamental = 'fundamental',
  price = 'price',
  reference = 'reference',
  valuation = 'valuation',
}

export enum ScreenerFilterOperator {
  between = 'bt',
  equals = 'eq',
  greaterThan = 'gt',
  includes = 'in',
  lessThan = 'lt',
  regex = 're',
}

export interface BaseScreenerField {
  category: ScreenerFieldCategory;
  fieldId: FieldId;
  label: string;
}

export enum ScreenerStringOperator {
  contains = 'contains',
  endsWith = 'endsWith',
  equals = 'equals',
  startsWith = 'startsWith',
}
export type ScreenerStringParameter = string | null;
export interface StringField extends BaseScreenerField {
  defaultOperator: ScreenerStringOperator;
  defaultParameter: ScreenerStringParameter;
  type: ScreenerFieldType.string;
}

export type ScreenerMultiselectParameter = ScreenerMultiselectOption[] | null;
export type ScreenerMultiselectOperator = ScreenerFilterOperator.includes;
export interface MultiselectField extends BaseScreenerField {
  defaultOperator: ScreenerMultiselectOperator;
  defaultParameter: ScreenerMultiselectParameter;
  options: ScreenerMultiselectOption[];
  type: ScreenerFieldType.multiselect;
}

export interface ScreenerMultiselectOption {
  label: string;
  optionId: string;
}

export type ScreenerRangeParameter = [string | null, string | null];
export type ScreenerRangeOperator = ScreenerFilterOperator.between;
export interface RangeField extends BaseScreenerField {
  defaultOperator: ScreenerRangeOperator;
  defaultParameter: ScreenerRangeParameter;
  type: ScreenerFieldType.range;
}

export type ScreenerSymbolParameter = AutocompleteItem[];
export type ScreenerSymbolOperator = ScreenerFilterOperator.includes;
export interface SymbolField extends BaseScreenerField {
  defaultOperator: ScreenerSymbolOperator;
  defaultParameter: ScreenerSymbolParameter;
  type: ScreenerFieldType.symbol;
}

export type ScreenerWatchlistParameter = ScreenerWatchlistOption[] | null;
export type ScreenerWatchlistOperator = ScreenerFilterOperator.includes;

export interface WatchlistField extends BaseScreenerField {
  defaultOperator: ScreenerWatchlistOperator;
  defaultParameter: ScreenerWatchlistParameter;
  type: ScreenerFieldType.watchlist;
}

export interface ScreenerWatchlistOption {
  label: string;
  optionId: string;
  symbols: string[];
}

export type FieldId = string; // TODO need enum for FieldName

export type ScreenerFieldsById = {
  [fieldId in FieldId]: ScreenerField;
};

export interface CategoryOption {
  categoryId: ScreenerFieldCategory;
  label: string;
}

export interface SignalsEndpointParams extends Params {
  filter: string;
  limit: number;
  screenerQuery?: string;
  start: number;
}

export interface SignalsEndpointResponse {
  signals: Signal[];
}
