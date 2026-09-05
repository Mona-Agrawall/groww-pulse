import { IMarketDataProvider, QuoteData, HistoricalData, SearchResult } from '../../src/lib/marketDataTypes.js';
import { BASE_STOCKS } from '../marketEngine.js';

const startTime = Date.now();

export class MockMarketDataProvider implements IMarketDataProvider {
  
  async isAvailable(): Promise<boolean> {
    return true; // Mock is always available
  }

  async getQuote(symbol: string): Promise<QuoteData> {
    const stock = BASE_STOCKS.find(s => s.symbol === symbol);
    if (!stock) throw new Error(`Symbol not found in mock data: ${symbol}`);

    const now = Date.now();
    const tickInterval = 5000; 
    const ticksSinceStart = Math.floor((now - startTime) / tickInterval);
    
    // Deterministic sine-wave tick
    const phaseOffset = stock.symbol.length;
    const tickModifier = Math.sin((ticksSinceStart + phaseOffset) * 0.1) * (stock.volatilityPercent / 100) * stock.basePrice;
    const currentPrice = Number((stock.basePrice + tickModifier).toFixed(2));
    
    // Calculate intraday high/low deterministically
    const intradayHigh = stock.basePrice * (1 + stock.volatilityPercent/100);
    const intradayLow = stock.basePrice * (1 - stock.volatilityPercent/100);

    // Simulate volume growing over the day
    const simulatedVolume = Math.floor(stock.avgVolume30d * (0.5 + (Math.sin(ticksSinceStart * 0.05) * 0.5)));

    return {
      symbol,
      price: currentPrice,
      open: stock.basePrice,
      high: intradayHigh,
      low: Math.min(intradayLow, currentPrice),
      previousClose: stock.yesterdayClose,
      volume: simulatedVolume,
      timestamp: Date.now()
    };
  }

  async getQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
    const results: Record<string, QuoteData> = {};
    for (const sym of symbols) {
      try {
        results[sym] = await this.getQuote(sym);
      } catch (e) {
        // Skip if not found
      }
    }
    return results;
  }

  async getHistoricalData(symbol: string, range: '1D' | '1W' | '1M' | '1Y'): Promise<HistoricalData> {
    const stock = BASE_STOCKS.find(s => s.symbol === symbol);
    if (!stock) throw new Error(`Symbol not found: ${symbol}`);

    // Deterministic seeded random based on symbol+range — same data every call
    const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0) +
                 range.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const seededRand = (i: number): number => {
      const x = Math.sin(seed + i * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    // Config per timeframe: how many candles, interval size, how much the price can drift
    const configs: Record<string, { points: number; intervalMs: number; intervalLabel: string; volatilityScale: number; startOffset: number }> = {
      '1D': { points: 30, intervalMs: 15 * 60 * 1000,        intervalLabel: '15min',  volatilityScale: 0.10, startOffset: 6.5 * 3600 * 1000 },
      '1W': { points: 35, intervalMs: 4  * 3600 * 1000,      intervalLabel: '4h',     volatilityScale: 0.40, startOffset: 7  * 24 * 3600 * 1000 },
      '1M': { points: 30, intervalMs: 24 * 3600 * 1000,      intervalLabel: '1day',   volatilityScale: 0.80, startOffset: 30 * 24 * 3600 * 1000 },
      '1Y': { points: 52, intervalMs: 7  * 24 * 3600 * 1000, intervalLabel: '1week',  volatilityScale: 2.50, startOffset: 365 * 24 * 3600 * 1000 },
    };

    const { points, intervalMs, intervalLabel, volatilityScale, startOffset } = configs[range];

    // For longer timeframes, start from a lower base so the chart shows a meaningful journey
    const rangeBasePrice: Record<string, number> = {
      '1D': stock.yesterdayClose,
      '1W': stock.basePrice * 0.97,   // ~3% below current
      '1M': stock.basePrice * 0.93,   // ~7% below current
      '1Y': stock.low52w,             // Start near 52-week low
    };

    let curTime = Date.now() - startOffset;
    let curPrice = rangeBasePrice[range] ?? stock.yesterdayClose;
    const targetPrice = stock.basePrice; // The price series trends toward current price

    const data = [];

    for (let i = 0; i < points; i++) {
      // Gentle mean-reversion drift toward target + seeded noise
      const progress = i / points;
      const drift = (targetPrice - curPrice) * 0.04 * progress;
      const noise = (seededRand(i) - 0.48) * stock.volatilityPercent * curPrice * volatilityScale * 0.01;
      curPrice = Math.max(stock.low52w * 0.85, curPrice + drift + noise);

      const open   = Number((curPrice - (seededRand(i + 1000) - 0.5) * curPrice * 0.005).toFixed(2));
      const high   = Number((Math.max(curPrice, open) + seededRand(i + 2000) * curPrice * 0.008).toFixed(2));
      const low    = Number((Math.min(curPrice, open) - seededRand(i + 3000) * curPrice * 0.008).toFixed(2));
      const volume = Math.floor(stock.avgVolume30d * (0.5 + seededRand(i + 4000) * 1.0));

      data.push({
        datetime: new Date(curTime).toISOString(),
        open,
        high,
        low,
        close: Number(curPrice.toFixed(2)),
        volume
      });
      curTime += intervalMs;
    }

    return { symbol, interval: intervalLabel, data };
  }

  async searchSymbols(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase().trim();
    return BASE_STOCKS.filter(s => 
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).map(s => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
      type: s.sector
    }));
  }
}
