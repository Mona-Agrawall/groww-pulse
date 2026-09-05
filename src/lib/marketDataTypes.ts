/**
 * MarketDataProvider Abstraction Layer
 * 
 * Defines the interface for swapping data sources:
 * MockMarketDataProvider → deterministic demo data (default)
 * TwelveDataProvider → real-time data via Twelve Data API
 * 
 * To switch to Twelve Data:
 * Set TWELVE_DATA_API_KEY in .env
 * Set MARKET_DATA_PROVIDER=twelve_data in .env
 */

export interface QuoteData {
 symbol: string;
 price: number;
 open: number;
 high: number;
 low: number;
 previousClose: number;
 volume: number;
 timestamp: number;
}

export interface HistoricalPoint {
 datetime: string;
 open: number;
 high: number;
 low: number;
 close: number;
 volume: number;
}

export interface HistoricalData {
 symbol: string;
 interval: string;
 data: HistoricalPoint[];
}

export interface SearchResult {
 symbol: string;
 name: string;
 exchange: string;
 type: string;
}

export interface IMarketDataProvider {
 getQuote(symbol: string): Promise<QuoteData>;
 getQuotes(symbols: string[]): Promise<Record<string, QuoteData>>;
 getHistoricalData(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<HistoricalData>;
 searchSymbols(query: string): Promise<SearchResult[]>;
 isAvailable(): Promise<boolean>;
}

export type DataProviderMode = 'mock' | 'twelve_data';
