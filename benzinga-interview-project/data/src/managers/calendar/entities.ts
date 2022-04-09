import { SafeError } from '@benzinga/safe-await';
import { UUID } from '..';
import { StockSymbol, TableParameters } from '../../entities';
import { WatchlistId, WatchlistsById } from '../watchlist/entities';
import { EventsAction } from './generateManagerParams';

// calendar data

export enum CalendarType {
  conference = 'conference',
  dividends = 'dividends',
  earnings = 'earnings',
  economics = 'economics',
  fda = 'fda',
  guidance = 'guidance',
  ipos = 'ipos',
  ma = 'ma',
  offerings = 'offerings',
  optionsActivity = 'optionsActivity',
  ratings = 'ratings',
  retail = 'retail',
  sec = 'sec',
  splits = 'splits',
}

type CalendarTypeToFeature = {
  [index in CalendarType]?: {
    action: string;
    resource: string;
  };
};
export const calendarTypeToFeature: CalendarTypeToFeature = {
  [CalendarType.optionsActivity]: {
    action: 'bzpro/feature/use',
    resource: 'signals-options',
  },
};

interface Drug {
  id: string;
  indication_symptom: string[];
  name: string;
}

interface Company {
  cik: string;
  id: string;
  name: string;
  securities: Security[];
}

interface Security {
  exchange: string;
  symbol: string;
}

interface EventEntity {
  id: string;
  name: string;
  ticker: string;
  type: CalendarType;
  updated: number;
}

export interface FDA extends EventEntity {
  commentary: string;
  companies: Company[];
  drug: Drug;
  event_type: string;
  nic_number: string;
  outcome: string;
  outcome_brief: string;
  source_link: string;
  source_type: string;
  status: string;
  target_date: string;
  time: string;
}

export interface Ratings extends EventEntity {
  action_company?: string;
  action_pt: string;
  analyst: string;
  analyst_name: string;
  date: string;
  rating_current: string;
  rating_prior: string;
  time: string;
  type: CalendarType.ratings;
  url: string;
  url_calendar: string;
  url_news: string;
}

export interface Conference extends EventEntity {
  access_code: string;
  date: string;
  exchange: string;
  importance: string;
  international_num: string;
  phone_num: string;
  reservation_num: string;
  start_time: string;
  time: string;
  type: CalendarType.conference;
  updated: number;
  website_url: string;
}

export interface Earnings extends EventEntity {
  date: string;
  date_confirmed: number;
  eps: string;
  eps_est: string;
  eps_prior: string;
  exchange: string; // TODO: 'NYSE', ... ?
  id: string;
  importance: number;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  period_year: string;
  revenue: string;
  revenue_prior: string;
  time: string;
  type: CalendarType.earnings;
  updated: number;
}

export interface Retail extends EventEntity {
  date: string;
  exchange: string;
  importance: string;
  period: string;
  period_year: string;
  sss: string;
  sss_est: string;
  time: string;
  type: CalendarType.retail;
  updated: number;
}

export interface Dividend extends EventEntity {
  date: string;
  dividend: string;
  dividend_prior: number;
  dividend_type: 'Cash';
  dividend_yield: string;
  ex_dividend_date: string;
  exchange: string;
  frequency: number;
  payable_date: string;
  record_date: string;
  type: CalendarType.dividends;
  updated: number;
}

export interface Economics extends EventEntity {
  actual: string;
  actual_t: string;
  consensus: string;
  consensus_t: string;
  country: string;
  date: string;
  description: string;
  event_name: string;
  event_period: string;
  importance: string;
  period_year: string;
  prior: string;
  prior_t: string;
  time: string;
  type: CalendarType.economics;
  updated: number;
}

// TODO needs attributes list
export interface Guidance extends EventEntity {
  date: string;
  time: string;
  type: CalendarType.guidance;
}

export interface IPOs extends EventEntity {
  date: string;
  deal_status: string;
  exchange: string;
  insider_lockup_date: string;
  insider_lockup_days: number;
  lead_underwriters: UnderWriters;
  offering_shares: string;
  offering_value: string;
  other_underwriters: UnderWriters;
  price_max: string;
  price_min: string;
  pricing_date: string;
  shares_from_selling_holders: string;
  shares_outstanding: string;
  time: string;
  type: CalendarType.ipos;
  underwriter_quiet_expiration_date: string;
  underwriter_quiet_expiration_days: string;
  updated: number;
}

export interface MergersAndAcquisitions extends EventEntity {
  acquirer_exchange: string;
  acquirer_name: string;
  acquirer_ticker: string;
  currency: string;
  date: string;
  date_completed: Date;
  date_expected: Date;
  deal_payment_type: string;
  deal_size: string;
  deal_status: string;
  deal_terms_extra?: string;
  deal_type: string;
  importance?: 0 | 1 | 2 | 3 | 4 | 5;
  notes?: string;
  target_exchange: string;
  target_name: string;
  target_ticker: string;
  type: CalendarType.ma;
  updated: number;
}

export interface UnusualOptionsActivity extends EventEntity {
  acquirer_exchange: string;
  acquirer_name: string;
  acquirer_ticker: string;
  currency: string;
  date: string;
  date_completed: Date;
  date_expected: Date;
  deal_payment_type: string;
  deal_size: string;
  deal_status: string;
  deal_terms_extra?: string;
  deal_type: string;
  importance?: 0 | 1 | 2 | 3 | 4 | 5;
  notes?: string;
  target_exchange: string;
  target_name: string;
  target_ticker: string;
  type: CalendarType.ma;
  underlying_price: number;
  updated: number;
}

export interface SEC extends EventEntity {
  accession_number: string;
  amendment: boolean;
  date: string;
  date_field: string;
  date_filing_changed: string;
  filer_cik: number;
  filer_name: string;
  filing_url: string;
  form13_data: string;
  form_data_ownership: string;
  form_type: string;
  is_paper: boolean;
  time: string;
  type: CalendarType.sec;
}
export interface Offerings extends EventEntity {
  date: string;
  type: CalendarType.offerings;
}

export interface Splits extends EventEntity {
  date_announced: string;
  date_distribution: string;
  date_ex: string;
  date_recorded: string;
  exchange: string;
  importance: string;
  optionable: string;
  ratio: string;
  type: CalendarType.splits;
  updated: number;
}

interface UnderWriters {
  id: string;
}

export interface CalendarTypeEvents {
  [CalendarType.conference]?: Conference[];
  [CalendarType.dividends]?: Dividend[];
  [CalendarType.earnings]?: Earnings[];
  [CalendarType.economics]?: Economics[];
  [CalendarType.guidance]?: Guidance[];
  [CalendarType.ipos]?: IPOs[];
  [CalendarType.ma]?: MergersAndAcquisitions[];
  [CalendarType.offerings]?: Offerings[];
  [CalendarType.optionsActivity]?: UnusualOptionsActivity[];
  [CalendarType.ratings]?: Ratings[];
  [CalendarType.retail]?: Retail[];
  [CalendarType.sec]?: SEC[];
  [CalendarType.splits]?: Splits[];
}

export type CalendarEvents =
  | Conference
  | Dividend
  | Earnings
  | Economics
  | Guidance
  | FDA
  | IPOs
  | MergersAndAcquisitions
  | Offerings
  | Ratings
  | Retail
  | SEC
  | Splits;

// Widget Entities

export type WidgetId = string;

export enum WidgetType {
  advancedCalendar = 'advancedCalendar',
  advancedNewsfeed = 'advancedNewsfeed',
  calendar = 'calendar',
  chart = 'chart',
  chat = 'chat',
  details = 'details',
  movers = 'movers',
  newsfeed = 'newsfeed',
  screener = 'screener',
  signals = 'signals',
  stream = 'stream',
  watchlist = 'watchlist',
}

type CalendarTable = {
  [key in CalendarType]: TableParameters;
};

export interface CalendarParameters {
  calendarType: CalendarType;
  dateEnd?: DefaultCalendarDate;
  dateStart?: DefaultCalendarDate;
  isPopout?: boolean;
  symbols: StockSymbol[];
  table: CalendarTable;
  type: WidgetType.advancedCalendar;
  updated?: number;
  watchlistIds: WatchlistId[];
}

export interface CalendarTransient {
  events?: CalendarEvents[];
  intervalCallback?: VoidFunction | null;
  isLoading: boolean;
  lastUpdatedEventsIds: CalendarEvents['id'][];
  updateInterval?: ReturnType<typeof setTimeout>;
}

// restful entities

export enum FetchMethod {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
}

export enum ErrorType {
  GET_EVENTS = 'get_events_error',
  UPDATE_EVENTS = 'update_events_error',
}

export enum CalendarCallType {
  ERROR = 'error',
  SET_EVENTS = 'set_calendar_events',
  SET_PARAMETERS = 'set_calendar_parameters',
  UPDATE_EVENTS = 'update_calendar_events',
  VOID = 'void',
}
export interface ErrorEvent {
  error?: SafeError;
  errorType: ErrorType;
  events?: CalendarEvents[];
  lastUpdatedEventsIds?: CalendarEvents['id'][];
  type: 'error';
  widgetId: WidgetId;
}
export interface SetCalendarEvent {
  events?: CalendarEvents[];
  eventsAction: EventsAction;
  lastUpdatedEventsIds?: CalendarEvents['id'][];
  newEvents: CalendarEvents[];
  parameters: CalendarParameters;
  prevEvents?: CalendarEvents[];
  requestParameters: CalendarParameters;
  sagaId: UUID;
  type: CalendarCallType.SET_EVENTS | CalendarCallType.VOID;
  watchlistsById: WatchlistsById;
  widgetId: WidgetId;
}

export interface UpdateCalendarEvent {
  events?: CalendarEvents[];
  lastUpdatedEventsIds?: CalendarEvents['id'][];
  newEvents: CalendarEvents[];
  parameters: CalendarParameters;
  prevEvents?: CalendarEvents[];
  type: CalendarCallType.UPDATE_EVENTS;
  widgetId: WidgetId;
}

export interface SetParametersEvent {
  events?: CalendarEvents[];
  lastUpdatedEventsIds?: CalendarEvents['id'][];
  parameters: CalendarParameters;
  sagaId: UUID;
  type: CalendarCallType.SET_PARAMETERS;
  widgetId: WidgetId;
}

export type CalendarManagerEvent = SetCalendarEvent | UpdateCalendarEvent | SetParametersEvent | ErrorEvent;

export enum ExtremeDateValue {
  max = '9999-12-31',
  min = '0000-01-01',
}

export enum CalendarUpdateInterval {
  basic = 30000,
  realtime = 5000,
}

export const CalendarUpdateModeTable = {
  [CalendarType.conference]: CalendarUpdateInterval.basic,
  [CalendarType.dividends]: CalendarUpdateInterval.basic,
  [CalendarType.earnings]: CalendarUpdateInterval.basic,
  [CalendarType.economics]: CalendarUpdateInterval.basic,
  [CalendarType.fda]: CalendarUpdateInterval.basic,
  [CalendarType.guidance]: CalendarUpdateInterval.basic,
  [CalendarType.ipos]: CalendarUpdateInterval.basic,
  [CalendarType.ma]: CalendarUpdateInterval.basic,
  [CalendarType.offerings]: CalendarUpdateInterval.basic,
  [CalendarType.optionsActivity]: CalendarUpdateInterval.realtime,
  [CalendarType.ratings]: CalendarUpdateInterval.basic,
  [CalendarType.retail]: CalendarUpdateInterval.basic,
  [CalendarType.sec]: CalendarUpdateInterval.basic,
  [CalendarType.splits]: CalendarUpdateInterval.basic,
};

// data definitions

export type DayOffset = number | null;
export type DefaultCalendarDate = string | null;

export interface DateRange {
  dateEnd?: DefaultCalendarDate;
  dateStart?: DefaultCalendarDate;
}

export interface DateDaysOffset {
  dateEndDaysOffset: DayOffset;
  dateStartDaysOffset: DayOffset;
}

export interface DateDefinition {
  defaultDates: {
    nothingSearched: DateDaysOffset;
    somethingSearched: DateDaysOffset;
  };
  name: string;
}
