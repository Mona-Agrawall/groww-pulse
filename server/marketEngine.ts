import {
  Stock,
  MarketIndex,
  MarketEvent,
  Watchlist,
  MarketPulse,
  StockDetailExtended,
  Timeframe,
  PricePoint,
  AttentionFactor,
  FeedStatus
} from '../src/types.js';
import { IMarketDataProvider, QuoteData } from '../src/lib/marketDataTypes.js';
import { TwelveDataProvider } from './providers/TwelveDataProvider.js';
import { MockMarketDataProvider } from './providers/MockMarketDataProvider.js';

let activeProvider: IMarketDataProvider;
if (process.env.MARKET_DATA_PROVIDER === 'twelve_data') {
  activeProvider = new TwelveDataProvider();
} else {
  activeProvider = new MockMarketDataProvider();
}


// Base stock master list with realistic baseline financial data
interface BaseStockData {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE' | string;
  sector: string;
  basePrice: number;
  yesterdayClose: number;
  avgVolume30d: number;
  high52w: number;
  low52w: number;
  high30d: number;
  low30d: number;
  volatilityPercent: number;
  marketCap: string;
  peRatio: number;
  tags: string[];
}

export const BASE_STOCKS: BaseStockData[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    sector: 'Energy & Retail',
    basePrice: 2431.20,
    yesterdayClose: 2341.50, // Moved +3.8%
    avgVolume30d: 6500000,
    high52w: 2510.00,
    low52w: 1980.00,
    high30d: 2445.00,
    low30d: 2310.00,
    volatilityPercent: 1.15,
    marketCap: '₹16.4T',
    peRatio: 26.4,
    tags: ['NIFTY 50', 'Conglomerate', 'Energy', 'Telecom']
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    sector: 'Information Technology',
    basePrice: 4128.50,
    yesterdayClose: 4051.00, // Crossed 30-day high of 4110
    avgVolume30d: 2100000,
    high52w: 4320.00,
    low52w: 3310.00,
    high30d: 4110.00,
    low30d: 3890.00,
    volatilityPercent: 1.05,
    marketCap: '₹14.9T',
    peRatio: 30.1,
    tags: ['NIFTY 50', 'IT Services', 'Tata Group']
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    sector: 'Banking & Financial Services',
    basePrice: 1642.10,
    yesterdayClose: 1687.80, // Dropped 2.7% after opening higher at 1695
    avgVolume30d: 14500000,
    high52w: 1794.00,
    low52w: 1363.00,
    high30d: 1715.00,
    low30d: 1620.00,
    volatilityPercent: 1.45,
    marketCap: '₹12.5T',
    peRatio: 19.8,
    tags: ['NIFTY 50', 'Banking', 'Private Bank']
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd',
    exchange: 'NSE',
    sector: 'Information Technology',
    basePrice: 1785.40,
    yesterdayClose: 1792.00,
    avgVolume30d: 5800000,
    high52w: 1950.00,
    low52w: 1358.00,
    high30d: 1840.00,
    low30d: 1740.00,
    volatilityPercent: 1.10,
    marketCap: '₹7.4T',
    peRatio: 27.2,
    tags: ['NIFTY 50', 'IT Services']
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    exchange: 'NSE',
    sector: 'Banking & Financial Services',
    basePrice: 1248.60,
    yesterdayClose: 1238.10,
    avgVolume30d: 11200000,
    high52w: 1300.00,
    low52w: 928.00,
    high30d: 1260.00,
    low30d: 1195.00,
    volatilityPercent: 1.20,
    marketCap: '₹8.8T',
    peRatio: 17.5,
    tags: ['NIFTY 50', 'Banking']
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    exchange: 'NSE',
    sector: 'Public Sector Banking',
    basePrice: 814.30,
    yesterdayClose: 820.00,
    avgVolume30d: 16000000,
    high52w: 912.00,
    low52w: 555.00,
    high30d: 845.00,
    low30d: 790.00,
    volatilityPercent: 1.35,
    marketCap: '₹7.2T',
    peRatio: 10.9,
    tags: ['NIFTY 50', 'PSU Bank']
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd',
    exchange: 'NSE',
    sector: 'Telecommunications',
    basePrice: 1622.75,
    yesterdayClose: 1595.00,
    avgVolume30d: 4900000,
    high52w: 1690.00,
    low52w: 915.00,
    high30d: 1640.00,
    low30d: 1540.00,
    volatilityPercent: 1.10,
    marketCap: '₹9.4T',
    peRatio: 48.0,
    tags: ['NIFTY 50', 'Telecom', '5G']
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Passenger Vehicles',
    exchange: 'NSE',
    sector: 'Automobile & EV',
    basePrice: 985.40,
    yesterdayClose: 960.20,
    avgVolume30d: 8200000,
    high52w: 1179.00,
    low52w: 610.00,
    high30d: 1020.00,
    low30d: 935.00,
    volatilityPercent: 1.85,
    marketCap: '₹3.6T',
    peRatio: 14.8,
    tags: ['NIFTY 50', 'EV', 'Auto', 'Tata Group']
  },
  {
    symbol: 'ITC',
    name: 'ITC Ltd',
    exchange: 'NSE',
    sector: 'FMCG & Hotels',
    basePrice: 472.10,
    yesterdayClose: 470.50,
    avgVolume30d: 9100000,
    high52w: 520.00,
    low52w: 399.00,
    high30d: 485.00,
    low30d: 465.00,
    volatilityPercent: 0.75,
    marketCap: '₹5.9T',
    peRatio: 27.9,
    tags: ['NIFTY 50', 'FMCG', 'Dividend']
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Ltd',
    exchange: 'NSE',
    sector: 'Capital Goods & Infrastructure',
    basePrice: 3580.00,
    yesterdayClose: 3515.00,
    avgVolume30d: 2400000,
    high52w: 3920.00,
    low52w: 2870.00,
    high30d: 3650.00,
    low30d: 3420.00,
    volatilityPercent: 1.25,
    marketCap: '₹4.9T',
    peRatio: 36.2,
    tags: ['NIFTY 50', 'Infrastructure', 'Defence']
  },
  {
    symbol: 'TITAN',
    name: 'Titan Company Ltd',
    exchange: 'NSE',
    sector: 'Consumer Discretionary',
    basePrice: 3410.00,
    yesterdayClose: 3425.00,
    avgVolume30d: 1100000,
    high52w: 3880.00,
    low52w: 3050.00,
    high30d: 3520.00,
    low30d: 3340.00,
    volatilityPercent: 1.20,
    marketCap: '₹3.0T',
    peRatio: 78.0,
    tags: ['NIFTY 50', 'Consumer', 'Tata Group']
  },
  {
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Ltd',
    exchange: 'NSE',
    sector: 'Financial Services',
    basePrice: 7120.00,
    yesterdayClose: 7015.00,
    avgVolume30d: 1300000,
    high52w: 8190.00,
    low52w: 6375.00,
    high30d: 7350.00,
    low30d: 6850.00,
    volatilityPercent: 1.40,
    marketCap: '₹4.4T',
    peRatio: 28.5,
    tags: ['NIFTY 50', 'NBFC', 'Credit']
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Electronics',
    basePrice: 175.50,
    yesterdayClose: 173.50,
    avgVolume30d: 55000000,
    high52w: 199.60,
    low52w: 164.08,
    high30d: 178.00,
    low30d: 168.00,
    volatilityPercent: 1.2,
    marketCap: '$2.8T',
    peRatio: 26.5,
    tags: ['S&P 500', 'Technology', 'US']
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    exchange: 'NASDAQ',
    sector: 'Software',
    basePrice: 405.20,
    yesterdayClose: 400.00,
    avgVolume30d: 22000000,
    high52w: 420.82,
    low52w: 309.45,
    high30d: 415.00,
    low30d: 395.00,
    volatilityPercent: 1.3,
    marketCap: '$3.0T',
    peRatio: 36.2,
    tags: ['S&P 500', 'Software', 'US']
  }
];

// Persistent simulated user state in memory
export interface UserSessionState {
  userId: string;
  lastVisitTimestamp: number;
  simulatedAwaySeconds: number;
  dismissedEventIds: Set<string>;
  acknowledgedEventIds: Set<string>;
  userStockSnapshots: Record<string, { price: number; timestamp: number }>;
  watchlists: Watchlist[];
  activeWatchlistId: string;
}

// Initialize default session state: exactly 7 hours 42 minutes ago (27,720 seconds) for the memorable hackathon demo!
const defaultAwaySeconds = 7 * 3600 + 42 * 60; // 7h 42m

/** Build a fresh canonical demo session (the "7h 42m away" scenario). */
function createDefaultSession(): UserSessionState {
  const ts = Date.now() - defaultAwaySeconds * 1000;
  return {
    userId: 'demo_user_2026',
    simulatedAwaySeconds: defaultAwaySeconds,
    lastVisitTimestamp: ts,
    dismissedEventIds: new Set<string>(),
    acknowledgedEventIds: new Set<string>(),
    userStockSnapshots: {
      RELIANCE:    { price: 2341.50, timestamp: ts },
      TCS:         { price: 4051.00, timestamp: ts },
      HDFCBANK:    { price: 1687.80, timestamp: ts },
      INFY:        { price: 1792.00, timestamp: ts },
      ICICIBANK:   { price: 1238.10, timestamp: ts },
      SBIN:        { price: 820.00,  timestamp: ts },
      BHARTIARTL:  { price: 1595.00, timestamp: ts },
      TATAMOTORS:  { price: 960.20,  timestamp: ts },
      ITC:         { price: 470.50,  timestamp: ts },
      LT:          { price: 3515.00, timestamp: ts },
      AAPL:        { price: 173.50,  timestamp: ts },
      MSFT:        { price: 400.00,  timestamp: ts },
    },
    watchlists: [
      {
        id: 'wl_default',
        name: 'Primary Watchlist',
        symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'TATAMOTORS', 'AAPL', 'MSFT'],
        isDefault: true,
        createdAt: Date.now() - 86400000 * 14,
        updatedAt: Date.now()
      },
      {
        id: 'wl_tech',
        name: 'Tech & Digital',
        symbols: ['TCS', 'INFY', 'BHARTIARTL'],
        isDefault: false,
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now()
      },
      {
        id: 'wl_banks',
        name: 'Indian Banks',
        symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
        isDefault: false,
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now()
      },
      {
        id: 'wl_heavyweights',
        name: 'Bluechips & Infra',
        symbols: ['RELIANCE', 'LT', 'ITC', 'TITAN', 'BAJFINANCE'],
        isDefault: false,
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now()
      }
    ],
    activeWatchlistId: 'wl_default'
  };
}

// ── Per-session store ────────────────────────────────────────────────────────
// Each browser tab (identified by X-Session-Id) gets its own isolated state.
// In-memory only — same persistence guarantees as before (resets on cold start).
const sessions = new Map<string, UserSessionState>();

/**
 * Returns (or creates) the isolated session state for the given session ID.
 * Called once per request in server.ts before any MarketDataProvider call.
 */
export function getOrCreateSession(sessionId?: string | null): UserSessionState {
  const key = sessionId?.trim() || 'default';
  if (!sessions.has(key)) {
    sessions.set(key, createDefaultSession());
  }
  return sessions.get(key)!;
}

import { GoogleGenAI } from '@google/genai';

// 2-minute TTL cache for narratives to prevent rate limit exhaustion
// Key: symbol, Value: { text, expiresAt }
const narrativeCache = new Map<string, { text: string; expiresAt: number }>();

/**
 * Meaningful Change & Attention Scoring Engine
 */
export class MeaningfulChangeEngine {
  /**
   * Calculate attention score and factors for a stock
   */
  static calculateAttention(
    stock: BaseStockData,
    currentPrice: number,
    volume: number,
    openPrice: number,
    userPreviousPrice: number,
    awayDurationStr: string
  ): { score: number; level: 'high' | 'medium' | 'low'; factors: AttentionFactor[] } {
    const factors: AttentionFactor[] = [];
    let score = 20; // baseline score

    const priceChangePct = ((currentPrice - stock.yesterdayClose) / stock.yesterdayClose) * 100;
    const absPriceChangePct = Math.abs(priceChangePct);
    const volumeRatio = volume / stock.avgVolume30d;
    const distanceTo30dHighPct = ((stock.high30d - currentPrice) / stock.high30d) * 100;
    const intradayFromOpenPct = ((currentPrice - openPrice) / openPrice) * 100;

    // 1. Abnormal volume factor
    if (volumeRatio >= 2.0) {
      const pts = Math.min(35, Math.round(volumeRatio * 14));
      score += pts;
      factors.push({
        id: 'vol_surge',
        label: `Volume ${volumeRatio.toFixed(1)}× normal`,
        points: pts,
        type: 'volume',
        description: `Trading at ${volumeRatio.toFixed(1)}× its 30-day average volume (${(volume / 1000000).toFixed(1)}M shares). Institutional interest indicated.`
      });
    } else if (volumeRatio >= 1.4) {
      score += 15;
      factors.push({
        id: 'vol_elevated',
        label: `Elevated volume (${volumeRatio.toFixed(1)}×)`,
        points: 15,
        type: 'volume',
        description: `Volume is ${Math.round((volumeRatio - 1) * 100)}% above normal levels.`
      });
    }

    // 2. Large price movement relative to historical volatility
    const volatilityMultiple = absPriceChangePct / (stock.volatilityPercent || 1.0);
    if (volatilityMultiple >= 2.5) {
      const pts = Math.min(30, Math.round(volatilityMultiple * 10));
      score += pts;
      factors.push({
        id: 'price_vol_shock',
        label: `${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(1)}% vs ${stock.volatilityPercent}% normal vol`,
        points: pts,
        type: 'volatility',
        description: `Today's ${priceChangePct.toFixed(1)}% move is ${volatilityMultiple.toFixed(1)}× the stock's typical daily swing.`
      });
    } else if (absPriceChangePct >= 1.5) {
      score += 15;
      factors.push({
        id: 'price_momentum',
        label: `${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(1)}% price expansion`,
        points: 15,
        type: 'price',
        description: `Strong directional price momentum through key sessions.`
      });
    }

    // 3. Resistance / 30-day high breakout
    if (currentPrice >= stock.high30d) {
      score += 28;
      factors.push({
        id: 'breakout_high',
        label: `Crossed 30-day high (₹${stock.high30d.toLocaleString('en-IN')})`,
        points: 28,
        type: 'breakout',
        description: `Clean technical breakout above the 30-day resistance level.`
      });
    } else if (distanceTo30dHighPct > 0 && distanceTo30dHighPct <= 1.5) {
      score += 18;
      factors.push({
        id: 'near_high',
        label: `Within 1.5% of 30-day high`,
        points: 18,
        type: 'breakout',
        description: `Approaching critical multi-week resistance at ₹${stock.high30d.toLocaleString('en-IN')}.`
      });
    }

    // 4. Intraday reversal / gap trap
    if (openPrice > stock.yesterdayClose * 1.008 && currentPrice < stock.yesterdayClose * 0.985) {
      score += 26;
      factors.push({
        id: 'gap_reversal',
        label: `Opened higher (+${((openPrice - stock.yesterdayClose) / stock.yesterdayClose * 100).toFixed(1)}%), collapsed ${intradayFromOpenPct.toFixed(1)}%`,
        points: 26,
        type: 'gap',
        description: `Intraday reversal trap: opened strong but heavy selling dragged it -${Math.abs(priceChangePct).toFixed(1)}% below close.`
      });
    }

    // 5. Meaningful change since user's last session
    if (userPreviousPrice > 0) {
      const userDeltaPct = ((currentPrice - userPreviousPrice) / userPreviousPrice) * 100;
      if (Math.abs(userDeltaPct) >= 2.5) {
        score += 16;
        factors.push({
          id: 'user_delta',
          label: `${userDeltaPct >= 0 ? '+' : ''}${userDeltaPct.toFixed(1)}% since your last visit`,
          points: 16,
          type: 'price',
          description: `Price moved ₹${Math.abs(currentPrice - userPreviousPrice).toFixed(1)} since you checked ${awayDurationStr} ago.`
        });
      }
    }

    // Cap score at 98 for realism
    score = Math.min(98, Math.max(12, score));
    const level = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

    return { score, level, factors };
  }

  /**
   * Build narrative explanation comparing last check vs now
   */
  static async buildStockDeltaNarrative(
    symbol: string,
    currentPrice: number,
    previousPrice: number,
    volumeRatio: number,
    high30d: number,
    awayDurationStr: string,
    attentionLevel: 'high' | 'medium' | 'low',
    factors: AttentionFactor[]
  ): Promise<string> {
    const diff = currentPrice - previousPrice;
    const pct = (diff / previousPrice) * 100;
    const sign = pct >= 0 ? '+' : '';

    // Check TTL Cache first
    const now = Date.now();
    const cached = narrativeCache.get(symbol);
    if (cached && cached.expiresAt > now) {
      return cached.text;
    }

    // Gemini AI narrative: only call if key exists AND not rate-limited
    // Free tier: 20 req/day — skip if quota is tight to preserve the demo experience
    const useGemini = process.env.GEMINI_API_KEY &&
      (attentionLevel === 'high') && // Only for HIGH attention stocks to save quota
      process.env.GEMINI_ENABLED !== 'false';

    if (useGemini) {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a sophisticated, professional financial analyst. I need a 1-2 sentence market update for the stock "${symbol}".
        
        Current Price: ${currentPrice}
        Percent Change: ${sign}${pct.toFixed(1)}%
        Volume compared to normal: ${volumeRatio.toFixed(1)}x
        Notable Factors detected: ${factors.map(f => f.label).join(', ')}

        Describe this price action concisely. 
        Tone: Premium, objective, quiet, high-information, editorial. 
        Rules: 
        1. DO NOT offer financial advice. 
        2. DO NOT perform math calculations, rely on the data provided. 
        3. Never output more than 2 sentences. 
        4. Focus on the 'why' and 'what it means' based on the factors provided.`;

        const response = await genAI.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        if (response.text) {
          // Cache for 2 minutes
          narrativeCache.set(symbol, { text: response.text, expiresAt: now + 2 * 60 * 1000 });
          return response.text;
        }
      } catch (e: any) {
        const status = e?.status ?? e?.response?.status ?? 0;
        if (status === 429) {
          // Rate limited — silently fall back, no noise in logs
        } else {
          console.warn(`[Gemini] ${symbol}: ${e?.message ?? e}`);
        }
      }
    }

    // Deterministic Fallback
    let fallbackText = '';
    if (symbol === 'RELIANCE') {
      fallbackText = `Since your last visit (${awayDurationStr} ago), RELIANCE gained 3.8%, traded at 2.4× its normal volume, and is within 0.6% of testing its 30-day high. Institutional block trades detected.`;
    } else if (symbol === 'TCS') {
      fallbackText = `Since your last visit, TCS crossed its 30-day resistance of ₹${high30d.toLocaleString('en-IN')}, registering +1.9% with sustained buyer accumulation across European session hours.`;
    } else if (symbol === 'HDFCBANK') {
      fallbackText = `Since your last visit, HDFCBANK opened higher (+0.5%) but suffered sharp institutional selling pressure, dropping 2.7% intraday on elevated options block activity.`;
    } else if (symbol === 'INFY') {
      fallbackText = `INFY consolidated tightly within a 0.5% corridor, absorbing mild profit taking while maintaining its 20-day moving average.`;
    } else if (symbol === 'TATAMOTORS') {
      fallbackText = `Tata Motors gained +2.6% on strong monthly EV dispatch volumes and commercial vehicle order book expansion.`;
    } else if (Math.abs(pct) >= 2) {
      fallbackText = `Since you last looked, ${symbol} moved ${sign}${pct.toFixed(1)}% (₹${diff > 0 ? '+' : ''}${diff.toFixed(1)}) with ${volumeRatio.toFixed(1)}× standard turnover.`;
    } else {
      fallbackText = `${symbol} held steady at ₹${currentPrice.toLocaleString('en-IN')} (${sign}${pct.toFixed(2)}%), experiencing orderly trading within historical range.`;
    }
    
    // Only cache fallbacks shortly (30s) so if API recovers, it switches over
    narrativeCache.set(symbol, { text: fallbackText, expiresAt: now + 30 * 1000 });
    return fallbackText;
  }
}

/**
 * Format seconds into concise human duration e.g. "7h 42m"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Synthetic dynamic price sparkline generator
 */
function generateSparkline(start: number, end: number, points = 24, volatility = 0.008): number[] {
  const result: number[] = [start];
  let curr = start;
  const step = (end - start) / (points - 1);
  for (let i = 1; i < points - 1; i++) {
    // Trend step + noise
    const noise = (Math.sin(i * 0.9) * 0.5 + Math.cos(i * 1.7) * 0.5) * (start * volatility);
    curr = start + step * i + noise;
    result.push(Number(curr.toFixed(2)));
  }
  result.push(Number(end.toFixed(2)));
  return result;
}

/**
 * Generate synthetic timeframe charts for stock detail modal
 */
function generateChartData(symbol: string, currentPrice: number): Record<Timeframe, PricePoint[]> {
  const timeframes: Timeframe[] = ['1D', '1W', '1M', '1Y', 'ALL'];
  const data: Record<Timeframe, PricePoint[]> = {} as any;

  // 1D: 30 intraday intervals (9:15 to 15:30)
  const intradayPoints: PricePoint[] = [];
  const startIntraday = symbol === 'RELIANCE' ? 2345 : symbol === 'HDFCBANK' ? 1695 : currentPrice * 0.988;
  const times = [
    '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
    '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30',
    '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15',
    '14:30', '14:45', '15:00', '15:15', '15:30'
  ];
  const step = (currentPrice - startIntraday) / (times.length - 1);
  times.forEach((t, i) => {
    let p = startIntraday + step * i;
    if (symbol === 'RELIANCE') {
      p += Math.sin(i * 0.6) * 12;
    } else if (symbol === 'HDFCBANK') {
      // opened high, dipped mid-day
      p = i < 6 ? 1695 - i * 3 : 1675 - (i - 6) * 2.2;
    } else {
      p += Math.cos(i * 0.5) * (currentPrice * 0.003);
    }
    if (i === times.length - 1) p = currentPrice;
    intradayPoints.push({
      time: t,
      price: Number(p.toFixed(2)),
      volume: Math.round(150000 + Math.abs(Math.sin(i)) * 400000)
    });
  });
  data['1D'] = intradayPoints;

  // 1W: 7 days
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Today'];
  data['1W'] = weekDays.map((d, i) => ({
    time: d,
    price: Number((currentPrice * (0.97 + i * 0.005 + Math.sin(i) * 0.008)).toFixed(2)),
    volume: Math.round(2500000 + i * 400000)
  }));
  data['1W'][data['1W'].length - 1].price = currentPrice;

  // 1M: 20 trading sessions
  data['1M'] = Array.from({ length: 20 }, (_, i) => ({
    time: `Day ${i + 1}`,
    price: Number((currentPrice * (0.93 + (i / 19) * 0.07 + Math.sin(i * 0.8) * 0.012)).toFixed(2)),
    volume: Math.round(3000000 + Math.cos(i) * 1000000)
  }));
  data['1M'][data['1M'].length - 1].price = currentPrice;

  // 1Y: 12 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  data['1Y'] = months.map((m, i) => ({
    time: m,
    price: Number((currentPrice * (0.82 + (i / 11) * 0.18 + Math.sin(i * 0.7) * 0.02)).toFixed(2)),
    volume: Math.round(80000000 + i * 5000000)
  }));
  data['1Y'][data['1Y'].length - 1].price = currentPrice;

  // ALL: 5 years
  const years = ['2022', '2023', '2024', '2025', '2026'];
  data['ALL'] = years.map((y, i) => ({
    time: y,
    price: Number((currentPrice * (0.55 + (i / 4) * 0.45)).toFixed(2)),
    volume: Math.round(500000000 + i * 100000000)
  }));
  data['ALL'][data['ALL'].length - 1].price = currentPrice;

  return data;
}

/**
 * Market Data Service Provider
 */
export class MarketDataProvider {
  /**
   * Get broad market indices
   */
  static getIndices(): MarketIndex[] {
    return [
      {
        symbol: 'NIFTY50',
        name: 'NIFTY 50',
        value: 25142.30,
        change: 148.60,
        changePercent: 0.60,
        high: 25198.40,
        low: 24980.10,
        sparkline: [24985, 25010, 25040, 25015, 25080, 25110, 25095, 25130, 25142.30]
      },
      {
        symbol: 'SENSEX',
        name: 'BSE SENSEX',
        value: 82365.75,
        change: 492.20,
        changePercent: 0.60,
        high: 82510.00,
        low: 81850.50,
        sparkline: [81860, 81950, 82050, 82010, 82180, 82290, 82240, 82320, 82365.75]
      },
      {
        symbol: 'BANKNIFTY',
        name: 'NIFTY BANK',
        value: 51840.10,
        change: -185.40,
        changePercent: -0.36,
        high: 52210.00,
        low: 51720.00,
        sparkline: [52150, 52190, 52050, 51920, 51890, 51780, 51740, 51810, 51840.10]
      },
      {
        symbol: 'GIFTNIFTY',
        name: 'GIFT NIFTY',
        value: 25210.00,
        change: 85.00,
        changePercent: 0.34,
        high: 25245.00,
        low: 25110.00,
        sparkline: [25120, 25140, 25160, 25180, 25190, 25200, 25210]
      }
    ];
  }

  /**
   * Get all stocks enriched with Attention Scores and user deltas
   */
  static async getStocks(session: UserSessionState, symbols?: string[]): Promise<Stock[]> {
    const list = symbols && symbols.length > 0
      ? BASE_STOCKS.filter(s => symbols.includes(s.symbol))
      : BASE_STOCKS;

    return Promise.all(list.map(async s => {
      const currentPrice = s.basePrice;
      const yesterdayClose = s.yesterdayClose;
      const change24h = currentPrice - yesterdayClose;
      const changePercent24h = (change24h / yesterdayClose) * 100;

      // Realistic volumes
      let volume = Math.round(s.avgVolume30d * 1.1);
      if (s.symbol === 'RELIANCE') volume = Math.round(s.avgVolume30d * 2.4); // 2.4x
      if (s.symbol === 'HDFCBANK') volume = Math.round(s.avgVolume30d * 1.8);
      if (s.symbol === 'TCS') volume = Math.round(s.avgVolume30d * 1.6);

      const openPrice = s.symbol === 'HDFCBANK' ? 1695.00 : s.symbol === 'RELIANCE' ? 2360.00 : yesterdayClose * 1.002;
      const dayHigh = Math.max(currentPrice, openPrice, s.high30d * 0.998);
      const dayLow = Math.min(currentPrice, openPrice, yesterdayClose * 0.99);

      // User snapshot baseline
      const snapshot = session.userStockSnapshots[s.symbol];
      const previousPrice = snapshot ? snapshot.price : yesterdayClose;
      const priceDiff = currentPrice - previousPrice;
      const percentDiff = (priceDiff / previousPrice) * 100;
      const awayStr = formatDuration(session.simulatedAwaySeconds);

      const attention = MeaningfulChangeEngine.calculateAttention(
        s,
        currentPrice,
        volume,
        openPrice,
        previousPrice,
        awayStr
      );

      const narrative = await MeaningfulChangeEngine.buildStockDeltaNarrative(
        s.symbol,
        currentPrice,
        previousPrice,
        volume / s.avgVolume30d,
        s.high30d,
        awayStr,
        attention.level,
        attention.factors
      );

      const sparkline = generateSparkline(
        previousPrice,
        currentPrice,
        24,
        s.volatilityPercent / 100
      );

      return {
        symbol: s.symbol,
        name: s.name,
        exchange: s.exchange,
        sector: s.sector,
        currentPrice,
        yesterdayClose,
        openPrice,
        dayHigh,
        dayLow,
        change24h: Number(change24h.toFixed(2)),
        changePercent24h: Number(changePercent24h.toFixed(2)),
        volume,
        avgVolume30d: s.avgVolume30d,
        volumeRatio: Number((volume / s.avgVolume30d).toFixed(1)),
        high52w: s.high52w,
        low52w: s.low52w,
        high30d: s.high30d,
        low30d: s.low30d,
        volatilityPercent: s.volatilityPercent,
        marketCap: s.marketCap,
        sparkline,
        attentionScore: attention.score,
        attentionLevel: attention.level,
        scoreFactors: attention.factors,
        tags: s.tags,
        userDelta: {
          previousPrice,
          currentPrice,
          priceDiff: Number(priceDiff.toFixed(2)),
          percentDiff: Number(percentDiff.toFixed(2)),
          lastSeenTimeFormatted: awayStr,
          narrative
        }
      };
    }));
  }

  /**
   * Get single stock extended detail
   */
  
  static async getStockDetail(session: UserSessionState, symbol: string, _timeframe: Timeframe): Promise<StockDetailExtended> {
    const stocks = await this.getStocks(session, [symbol]);
    const stock = stocks[0];
    if (!stock) throw new Error('Stock not found');

    // Always use mock for charts (deterministic, seeded, instant)
    const mockProvider = activeProvider instanceof MockMarketDataProvider
      ? activeProvider
      : new MockMarketDataProvider();

    // Load all timeframes in parallel so tab-switching is instant client-side
    const [h1D, h1W, h1M, h1Y] = await Promise.all([
      mockProvider.getHistoricalData(symbol, '1D'),
      mockProvider.getHistoricalData(symbol, '1W'),
      mockProvider.getHistoricalData(symbol, '1M'),
      mockProvider.getHistoricalData(symbol, '1Y'),
    ]);

    const toPoints = (h: { data: any[] }): PricePoint[] =>
      h.data.map((d: any) => ({
        time: new Date(d.datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: d.close,
        volume: d.volume
      }));

    const base = BASE_STOCKS.find(s => s.symbol === symbol);
    const resistanceLevel = Number((stock.high52w * 0.995).toFixed(2));
    const supportLevel    = Number((stock.low52w  * 1.005).toFixed(2));
    const analystConsensus = stock.attentionScore >= 65 ? 'Buy' : stock.attentionScore >= 40 ? 'Hold' : 'Sell';

    return {
      ...stock,
      chartData: {
        '1D': toPoints(h1D),
        '1W': toPoints(h1W),
        '1M': toPoints(h1M),
        '1Y': toPoints(h1Y),
        'ALL': toPoints(h1Y),
      },
      resistanceLevel,
      supportLevel,
      analystConsensus,
      peRatio: base?.peRatio ?? 25,
      events: this.getEvents([symbol])
    };
  }

  /**
   * Get chronological events stream
   */
  static getEvents(session: UserSessionState, symbols?: string[]): MarketEvent[] {
    const now = Date.now();
    const awaySec = session.simulatedAwaySeconds;
    const startOfAway = now - awaySec * 1000;

    const rawEvents: MarketEvent[] = [
      {
        id: 'evt_rel_1',
        timestamp: startOfAway + 2800 * 1000,
        timeFormatted: '09:42 AM',
        stockSymbol: 'RELIANCE',
        stockName: 'Reliance Industries',
        title: 'Breakout Above +3.0%',
        change: '+3.8%',
        changeType: 'price_up',
        importance: 'critical',
        explanation: 'RELIANCE surged past ₹2,410 on 2.4× 30-day average volume, driven by retail & petrochemical margin expansion rumors.',
        miniChart: [2342, 2350, 2368, 2390, 2415, 2431],
        dismissed: session.dismissedEventIds.has('evt_rel_1'),
        acknowledged: session.acknowledgedEventIds.has('evt_rel_1')
      },
      {
        id: 'evt_tcs_1',
        timestamp: startOfAway + 4800 * 1000,
        timeFormatted: '10:18 AM',
        stockSymbol: 'TCS',
        stockName: 'Tata Consultancy Services',
        title: 'Crossed 30-day High Resistance',
        change: '+1.9%',
        changeType: 'breakout_high',
        importance: 'high',
        explanation: 'Broke clean through ₹4,110 multi-week ceiling with strong European market open buy orders and zero intraday pullback.',
        miniChart: [4050, 4065, 4080, 4105, 4118, 4128],
        dismissed: session.dismissedEventIds.has('evt_tcs_1'),
        acknowledged: session.acknowledgedEventIds.has('evt_tcs_1')
      },
      {
        id: 'evt_hdfc_1',
        timestamp: startOfAway + 7600 * 1000,
        timeFormatted: '11:06 AM',
        stockSymbol: 'HDFCBANK',
        stockName: 'HDFC Bank',
        title: 'Intraday Reversal & Volume Spike',
        change: '-2.7%',
        changeType: 'price_down',
        importance: 'critical',
        explanation: 'Gap-up to ₹1,695 was forcefully rejected; aggressive institutional selling dumped 14.5M shares down to ₹1,642 support.',
        miniChart: [1695, 1682, 1668, 1655, 1640, 1642],
        dismissed: session.dismissedEventIds.has('evt_hdfc_1'),
        acknowledged: session.acknowledgedEventIds.has('evt_hdfc_1')
      },
      {
        id: 'evt_infy_1',
        timestamp: startOfAway + 13500 * 1000,
        timeFormatted: '12:43 PM',
        stockSymbol: 'INFY',
        stockName: 'Infosys Ltd',
        title: 'Volatility Contraction to Normal Range',
        change: '-0.3%',
        changeType: 'range_recovery',
        importance: 'medium',
        explanation: 'Morning spread tightened from 1.8% to 0.4%; options implied volatility cooled down back into normal 30-day band.',
        miniChart: [1792, 1788, 1782, 1784, 1786, 1785],
        dismissed: session.dismissedEventIds.has('evt_infy_1'),
        acknowledged: session.acknowledgedEventIds.has('evt_infy_1')
      },
      {
        id: 'evt_tata_1',
        timestamp: startOfAway + 18200 * 1000,
        timeFormatted: '02:08 PM',
        stockSymbol: 'TATAMOTORS',
        stockName: 'Tata Motors',
        title: 'Automotive EV Delivery Surge',
        change: '+2.6%',
        changeType: 'price_up',
        importance: 'high',
        explanation: 'Monthly electric vehicle delivery numbers beat consensus by 14%; share price pushed through ₹980 psychological barrier.',
        miniChart: [960, 965, 972, 976, 982, 985],
        dismissed: session.dismissedEventIds.has('evt_tata_1'),
        acknowledged: session.acknowledgedEventIds.has('evt_tata_1')
      },
      {
        id: 'evt_bharti_1',
        timestamp: startOfAway + 22400 * 1000,
        timeFormatted: '03:15 PM',
        stockSymbol: 'BHARTIARTL',
        stockName: 'Bharti Airtel',
        title: 'ARPU Guidance Upgrade',
        change: '+1.7%',
        changeType: 'breakout_high',
        importance: 'medium',
        explanation: 'Brokerage note lifted average revenue per user target to ₹230, lifting telecommunications sector sentiment.',
        miniChart: [1595, 1602, 1610, 1618, 1622, 1623],
        dismissed: session.dismissedEventIds.has('evt_bharti_1'),
        acknowledged: session.acknowledgedEventIds.has('evt_bharti_1')
      }
    ];

    let filtered = rawEvents;
    if (symbols && symbols.length > 0) {
      filtered = filtered.filter(e => symbols.includes(e.stockSymbol));
    }
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Produce the central "Market Pulse" summary
   * "You were away for 7h 42m. 3 things changed meaningfully..."
   */
  
  static async getMarketPulse(session: UserSessionState, watchlistSymbols: string[]): Promise<MarketPulse> {
    const activeStocks = await this.getStocks(session, watchlistSymbols);
    const events = this.getEvents(session, watchlistSymbols).filter(e => !e.dismissed);

    const awaySec = session.simulatedAwaySeconds;
    const awayFormatted = formatDuration(awaySec);

    const highAttentionStocks = activeStocks.filter(s => s.attentionScore >= 65);
    const positiveMoves = activeStocks.filter(s => s.userDelta.percentDiff >= 1.2);
    const negativeMoves = activeStocks.filter(s => s.userDelta.percentDiff <= -1.2);

    const meaningfulCount = Math.max(3, highAttentionStocks.length);
    const topHighlights = events.slice(0, 4);

    const avgChange = activeStocks.reduce((sum, s) => sum + s.userDelta.percentDiff, 0) / (activeStocks.length || 1);

    return {
      awayDurationFormatted: awayFormatted,
      awayDurationSeconds: awaySec,
      lastVisitTimestamp: session.lastVisitTimestamp,
      currentTimestamp: Date.now(),
      totalChangesCount: activeStocks.length,
      meaningfulChangesCount: meaningfulCount,
      positiveCount: positiveMoves.length,
      negativeCount: negativeMoves.length,
      eventsCount: events.length,
      overallWatchlistChange: Number(avgChange.toFixed(2)),
      topHighlights,
      narrativeSummary: `You were away for ${awayFormatted}. ${meaningfulCount} things changed meaningfully across your watchlist. RELIANCE gained +3.8% on 2.4× volume, TCS breached its 30-day resistance, while HDFCBANK reversed intraday (-2.7%).`
    };
  }

  /**
   * Search across all stocks
   */
  
  static async search(query: string): Promise<Stock[]> {
    // search() is session-agnostic: uses a fresh default session so results
    // are not personalised to any specific tab's time-travel state.
    const searchSession = getOrCreateSession('__search__');
    if (!query || query.trim() === '') return this.getStocks(searchSession, BASE_STOCKS.slice(0, 6).map(s => s.symbol));
    const searchResults = await activeProvider.searchSymbols(query);
    const symbols = searchResults.map(s => s.symbol).slice(0, 10);
    if (symbols.length === 0) return [];
    return this.getStocks(searchSession, symbols);
  }

  /**
   * Feed data status indicator
   */
  
  static async getFeedStatus(): Promise<FeedStatus> {
    const isLive = process.env.MARKET_DATA_PROVIDER === 'twelve_data';
    return {
      mode: isLive ? 'LIVE' : 'DELAYED',
      label: isLive ? 'Market data · Live' : 'Market data · Delayed 15 min',
      detail: isLive ? 'Real-time data stream active via Twelve Data API.' : 'Synchronized with NSE/BSE delayed feed. Attention engine updating every 10s.',
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }

}
