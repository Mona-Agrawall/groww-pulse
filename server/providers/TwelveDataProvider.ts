import { MockMarketDataProvider } from './MockMarketDataProvider.js';
import { IMarketDataProvider, QuoteData, HistoricalData, SearchResult } from '../../src/lib/marketDataTypes.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class TwelveDataProvider implements IMarketDataProvider {
  private apiKey: string;
  private cacheTTL = 60 * 1000; // 60 seconds
  private quoteCache: Map<string, CacheEntry<QuoteData>> = new Map();
  private pendingBatch: Set<string> = new Set();
  
  constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Twelve Data] TWELVE_DATA_API_KEY is missing in environment variables.');
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getQuote(symbol: string): Promise<QuoteData> {
    const quotes = await this.getQuotes([symbol]);
    if (!quotes[symbol]) throw new Error(`Could not fetch quote for ${symbol}`);
    return quotes[symbol];
  }

  async getQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};
    const symbolsToFetch: string[] = [];
    const now = Date.now();

    // Check cache first
    for (const sym of symbols) {
      const cached = this.quoteCache.get(sym);
      if (cached && (now - cached.timestamp < this.cacheTTL)) {
        results[sym] = cached.data;
      } else {
        symbolsToFetch.push(sym);
      }
    }

    if (symbolsToFetch.length === 0) {
      return results;
    }

    // Fetch from API
    try {
      const symbolString = symbolsToFetch.join(',');
      const url = `https://api.twelvedata.com/quote?symbol=${symbolString}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Twelve Data HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Handle rate limits / errors gracefully
      if (data.code === 429) {
        console.error('[Twelve Data] Rate limit exceeded (429)');
        // Try returning stale cache if possible
        await this.fallbackToStaleCache(symbolsToFetch, results);
        return results;
      }

      if (data.status === 'error') {
        console.error(`[Twelve Data] API Error: ${data.message}`);
        await this.fallbackToStaleCache(symbolsToFetch, results);
        return results;
      }

      // Twelve Data returns a single object if 1 symbol is requested, or a map if multiple
      if (symbolsToFetch.length === 1) {
        const sym = symbolsToFetch[0];
        if (data.symbol) {
          const parsed = this.parseQuote(data);
          results[sym] = parsed;
          this.quoteCache.set(sym, { data: parsed, timestamp: now });
        }
      } else {
        for (const sym of symbolsToFetch) {
          const item = data[sym];
          if (item && item.symbol) {
            const parsed = this.parseQuote(item);
            results[sym] = parsed;
            this.quoteCache.set(sym, { data: parsed, timestamp: now });
          }
        }
      }
    } catch (err) {
      console.error('[Twelve Data] Network error:', err);
      await this.fallbackToStaleCache(symbolsToFetch, results);
    }

    return results;
  }

  private async fallbackToStaleCache(symbols: string[], results: Record<string, QuoteData>) {
    let mockProvider: MockMarketDataProvider | null = null;

    for (const sym of symbols) {
      const stale = this.quoteCache.get(sym);
      if (stale) {
        results[sym] = stale.data;
      } else {
        // Fallback to mock data if it's not in cache and Twelve Data failed
        if (!mockProvider) {
          const { MockMarketDataProvider } = await import('./MockMarketDataProvider.js');
          mockProvider = new MockMarketDataProvider();
        }
        try {
          results[sym] = await mockProvider.getQuote(sym);
        } catch (e) {
          console.error(`[Twelve Data Fallback] Could not get mock quote for ${sym}`);
        }
      }
    }
  }

  private parseQuote(data: any): QuoteData {
    return {
      symbol: data.symbol,
      price: parseFloat(data.close || data.previous_close || 0), // 'close' is current price in /quote
      open: parseFloat(data.open || 0),
      high: parseFloat(data.high || 0),
      low: parseFloat(data.low || 0),
      previousClose: parseFloat(data.previous_close || 0),
      volume: parseInt(data.volume || 0, 10),
      timestamp: Date.now()
    };
  }

  async getHistoricalData(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<HistoricalData> {
    // The user explicitly requested to keep historical charts mocked for now to avoid burning rate limits
    throw new Error('Historical data via Twelve Data is disabled as per user instruction. Fallback to mock should occur.');
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    // Search endpoint does not consume API credits on Twelve Data
    try {
      const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=5`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          symbol: item.symbol,
          name: item.instrument_name || item.name,
          exchange: item.exchange,
          type: item.instrument_type
        }));
      }
    } catch (e) {
      console.error('[Twelve Data] Search failed:', e);
    }
    return [];
  }
}
