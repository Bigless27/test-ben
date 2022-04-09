import { StockSymbol } from '../../entities';

export type Security = string;

export type QuoteSessionType = 'AFTER_MARKET' | 'NA' | 'PRE_MARKET' | 'REGULAR';

export interface QuoteDetail {
  companyName: string;
  currency: string;
  delayedMinutes?: number;
  exchange: string;
  source?: string; // absent for real-time quotes
}

export interface ErrorQuote {
  error: string;
  symbol: StockSymbol;
}

export interface IncomingQuote {
  afterMarketPrice?: number;
  afterMarketVolume?: number;
  askPrice?: number;
  bidPrice?: number;
  change?: number;

  close?: number;
  currency?: string;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  // timestamp
  lastTradePrice?: number;

  lastTradeTime?: string;
  open?: number;
  percentChange?: number;
  preMarketPrice?: number;
  preMarketVolume?: number;
  previousClose?: number;
  sessionType?: QuoteSessionType;
  symbol: StockSymbol;
  volume?: number;
}

export interface InitialQuote {
  detail: QuoteDetail;
  quote?: IncomingQuote;
  symbol: string;
}

export type Quote = IncomingQuote;
