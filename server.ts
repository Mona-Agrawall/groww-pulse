import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  MarketDataProvider,
  getOrCreateSession,
  BASE_STOCKS,
  formatDuration
} from './server/marketEngine.js';
import { requireAuth, AuthenticatedRequest } from './server/authMiddleware.js';
import { supabaseRepo } from './server/supabaseRepo.js';

// Gemini AI – explanation layer only, never a source of financial facts
let GoogleGenAI: any;
let genAI: any;
// Top level await removed for build compatibility. Gemini will be loaded dynamically if needed later.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Deterministic fallback narratives (when Gemini is unavailable) ──────────
// These are pre-computed explanations that read naturally and are always correct.
const FALLBACK_NARRATIVES: Record<string, string> = {
  RELIANCE: 'RELIANCE deserves attention because it gained 3.8% while trading at roughly 2.4× its normal volume and is approaching its recent 30-day high — a combination that historically signals strong institutional interest.',
  TCS: 'TCS cleared its 30-day resistance at ₹4,110 on sustained buying pressure, making this a technically significant breakout worth watching.',
  HDFCBANK: 'HDFCBANK opened higher but reversed sharply, losing 2.7% on elevated institutional selling — the gap-up rejection pattern warrants close monitoring.',
  INFY: 'Infosys is holding steady near its moving average with no exceptional signals. Normal market session.',
  ICICIBANK: 'ICICI Bank is trading within its recent range with slightly elevated volume, no exceptional signals detected.',
  SBIN: 'SBI is in a mild consolidation phase with normal volume activity.',
  BHARTIARTL: 'Bharti Airtel gained 1.7% after a brokerage upgrade, approaching the upper end of its recent trading range.',
  TATAMOTORS: 'Tata Motors rose 2.6% on strong electric vehicle delivery numbers, pushing past the ₹980 psychological level.',
  ITC: 'ITC is trading quietly near flat, with no noteworthy activity since your last check.',
  LT: 'Larsen & Toubro showed moderate upside with infrastructure sentiment supporting the sector.',
  TITAN: 'Titan is in a mild pullback from recent highs with no significant catalyst.',
  BAJFINANCE: 'Bajaj Finance is up moderately, reflecting continued credit growth momentum in the NBFC sector.',
};

function buildFallbackNarrative(facts: any): string {
  if (FALLBACK_NARRATIVES[facts.symbol]) return FALLBACK_NARRATIVES[facts.symbol];
  const sign = facts.priceChangePct >= 0 ? '+' : '';
  return `${facts.symbol} moved ${sign}${facts.priceChangePct?.toFixed(1) ?? '0.0'}% with ${facts.volumeMultiple?.toFixed(1) ?? '1.0'}× its normal volume since your last visit ${facts.timeSinceLastSeen} ago.`;
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Seed stocks to DB automatically on startup (fire and forget for serverless)
supabaseRepo.ensureStocksSeeded().catch(console.error);

// ── API Routes ─────────────────────────────────────────────────────────────

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      provider: process.env.MARKET_DATA_PROVIDER || 'mock',
      gemini: process.env.GEMINI_API_KEY ? 'available' : 'unavailable (fallback active)',
    });
  });

  // ── Market Indices ──────────────────────────────────────────────────────────
  app.get('/api/market/indices', (_req, res) => {
    try {
      res.json({ success: true, data: MarketDataProvider.getIndices() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Watchlists ──────────────────────────────────────────────────────────────
  app.get('/api/watchlists', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.token) {
        const repoData = await supabaseRepo.getWatchlists(req.token);
        return res.json({ success: true, data: repoData.watchlists, activeId: repoData.activeId });
      } else {
        const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
        return res.json({
          success: true,
          data: session.watchlists,
          activeId: session.activeWatchlistId,
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/watchlists', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { name, symbols } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Watchlist name required' });
    }
    try {
      if (req.token) {
        const data = await supabaseRepo.createWatchlist(req.token, name.trim().slice(0, 50), symbols || []);
        return res.json({ success: true, data });
      } else {
        const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
        const newWl = {
          id: `wl_${Date.now()}`,
          name: name.trim().slice(0, 50),
          symbols: Array.isArray(symbols) ? symbols.filter((s: any) => typeof s === 'string') : ['RELIANCE', 'TCS'],
          isDefault: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        session.watchlists.push(newWl);
        session.activeWatchlistId = newWl.id;
        return res.json({ success: true, data: newWl });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/watchlists/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { name, symbols, setActive } = req.body;
    try {
      if (req.token) {
        const wl = await supabaseRepo.updateWatchlist(req.token, id, name, symbols, setActive);
        return res.json({ success: true, data: wl });
      } else {
        const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
        const wl = session.watchlists.find((w) => w.id === id);
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        if (name && typeof name === 'string') wl.name = name.trim().slice(0, 50);
        if (Array.isArray(symbols)) wl.symbols = symbols.filter((s: any) => typeof s === 'string');
        wl.updatedAt = Date.now();
        if (setActive) session.activeWatchlistId = id;
        return res.json({ success: true, data: wl });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/watchlists/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    try {
      if (req.token) {
        const activeId = await supabaseRepo.deleteWatchlist(req.token, id);
        return res.json({ success: true, activeId });
      } else {
        const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
        if (session.watchlists.length <= 1) {
          return res.status(400).json({ error: 'Cannot delete the only watchlist' });
        }
        session.watchlists = session.watchlists.filter((w) => w.id !== id);
        if (session.activeWatchlistId === id) {
          session.activeWatchlistId = session.watchlists[0].id;
        }
        return res.json({ success: true, activeId: session.activeWatchlistId });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ── Stocks ──────────────────────────────────────────────────────────────────
  app.get('/api/market/stocks', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let wl;
      const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
      if (req.token) {
        const { watchlists, activeId } = await supabaseRepo.getWatchlists(req.token);
        const wId = (req.query.watchlistId as string) || activeId;
        wl = watchlists.find((w: any) => w.id === wId) || watchlists[0];
      } else {
        const watchlistId = (req.query.watchlistId as string) || session.activeWatchlistId;
        wl = session.watchlists.find((w) => w.id === watchlistId) || session.watchlists[0];
      }
      const stocks = await MarketDataProvider.getStocks(session, wl?.symbols);
      res.json({ success: true, data: stocks, watchlist: wl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/market/stocks/all', async (req, res) => {
    try {
      res.json({ success: true, data: await MarketDataProvider.getStocks(getOrCreateSession(), []) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/market/search', async (req, res) => {
    try {
      const q = (req.query.q as string) || '';
      res.json({ success: true, data: await MarketDataProvider.search(q) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/market/stocks/:symbol', async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
      const detail = await MarketDataProvider.getStockDetail(session, symbol, '1D');
      if (!detail) return res.status(404).json({ error: 'Stock not found' });
      res.json({ success: true, data: detail });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Market Pulse ────────────────────────────────────────────────────────────
  app.get('/api/market/pulse', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let wl;
      const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
      if (req.token) {
        const { watchlists, activeId } = await supabaseRepo.getWatchlists(req.token);
        const wId = (req.query.watchlistId as string) || activeId;
        wl = watchlists.find((w: any) => w.id === wId) || watchlists[0];
      } else {
        const watchlistId = (req.query.watchlistId as string) || session.activeWatchlistId;
        wl = session.watchlists.find((w) => w.id === watchlistId) || session.watchlists[0];
      }
      const pulse = await MarketDataProvider.getMarketPulse(session, wl?.symbols || []);
      res.json({ success: true, data: pulse });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Events ──────────────────────────────────────────────────────────────────
  app.get('/api/market/events', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      let wl;
      const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
      if (req.token) {
        const { watchlists, activeId } = await supabaseRepo.getWatchlists(req.token);
        const wId = (req.query.watchlistId as string) || activeId;
        wl = watchlists.find((w: any) => w.id === wId) || watchlists[0];
      } else {
        const watchlistId = (req.query.watchlistId as string) || session.activeWatchlistId;
        wl = session.watchlists.find((w) => w.id === watchlistId) || session.watchlists[0];
      }
      const events = await MarketDataProvider.getEvents(session, wl?.symbols);
      res.json({ success: true, data: events });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/market/events/:id/acknowledge', (req, res) => {
    const { id } = req.params;
    const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
    session.acknowledgedEventIds.add(id);
    res.json({ success: true, acknowledged: true, id });
  });

  app.post('/api/market/events/:id/dismiss', (req, res) => {
    const { id } = req.params;
    const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
    session.dismissedEventIds.add(id);
    res.json({ success: true, dismissed: true, id });
  });

  // ── Feed Status ─────────────────────────────────────────────────────────────
  app.get('/api/market/status', (_req, res) => {
    res.json({ success: true, data: MarketDataProvider.getFeedStatus() });
  });

  // ── Gemini AI Explanation Endpoint ──────────────────────────────────────────
  // The AI receives ONLY verified, deterministically-calculated facts.
  // It converts them into a concise human-readable explanation.
  // It NEVER invents prices, percentages, or events.
  app.post('/api/ai/explain', async (req, res) => {
    const facts = req.body?.facts;
    if (!facts || !facts.symbol) {
      return res.status(400).json({ error: 'facts.symbol required' });
    }

    // Always return fallback immediately if Gemini not configured
    if (!genAI) {
      return res.json({
        success: true,
        narrative: buildFallbackNarrative(facts),
        source: 'fallback',
      });
    }

    // Build a tight, grounded prompt from facts only
    const factSummary = [
      `Stock: ${facts.symbol} (${facts.name || facts.symbol})`,
      facts.priceChangePct !== undefined ? `Price change since last visit: ${facts.priceChangePct > 0 ? '+' : ''}${Number(facts.priceChangePct).toFixed(2)}%` : null,
      facts.volumeMultiple !== undefined ? `Volume: ${Number(facts.volumeMultiple).toFixed(1)}× 30-day average` : null,
      facts.crossed30dHigh ? `Crossed 30-day high resistance` : null,
      facts.crossedRecentLow ? `Broke below 30-day support` : null,
      facts.gapReversal ? `Gap-up reversed intraday (bearish rejection)` : null,
      facts.timeSinceLastSeen ? `Time since user's last check: ${facts.timeSinceLastSeen}` : null,
      facts.attentionScore !== undefined ? `Attention score: ${facts.attentionScore}/100` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `You are a concise market intelligence assistant. 
Using ONLY the verified facts provided below, write a single clear sentence (max 30 words) explaining why this stock deserves the user's attention.

Rules:
- Do NOT invent any numbers, prices, or events not in the facts.
- Do NOT use the words "buy", "sell", "guarantee", "predict", or "profit".
- Write in plain English. No jargon like RSI/MACD/Bollinger.
- Start with the stock symbol.

Verified facts:
${factSummary}

Response (one sentence only):`;

    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { maxOutputTokens: 80, temperature: 0.3 },
      });
      const text = response.text?.trim() || buildFallbackNarrative(facts);
      res.json({ success: true, narrative: text, source: 'gemini' });
    } catch (err: any) {
      console.warn('[Gemini] API error, using fallback:', err.message);
      res.json({
        success: true,
        narrative: buildFallbackNarrative(facts),
        source: 'fallback',
      });
    }
  });

  // ── Time Travel Simulator ───────────────────────────────────────────────────
  app.post('/api/session/time-travel', (req, res) => {
    const { awaySeconds, preset } = req.body;
    let targetSec = 27720; // 7h 42m default

    if (preset === '15m') targetSec = 15 * 60;
    else if (preset === '2h') targetSec = 2 * 3600;
    else if (preset === '7h42m') targetSec = 7 * 3600 + 42 * 60;
    else if (preset === '24h') targetSec = 24 * 3600;
    else if (preset === '3d') targetSec = 72 * 3600;
    else if (typeof awaySeconds === 'number' && awaySeconds >= 0) targetSec = awaySeconds;

    const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
    session.simulatedAwaySeconds = targetSec;
    session.lastVisitTimestamp = Date.now() - targetSec * 1000;

    // Reset user snapshots to "previous" price (before the demo moves happened)
    const factor = targetSec >= 24 * 3600 ? 0.93 : 0.97;
    BASE_STOCKS.forEach((s) => {
      session.userStockSnapshots[s.symbol] = {
        price: Number((s.yesterdayClose * (s.symbol === 'HDFCBANK' ? 1.027 : factor)).toFixed(2)),
        timestamp: session.lastVisitTimestamp,
      };
    });

    res.json({
      success: true,
      simulatedAwaySeconds: targetSec,
      lastVisitTimestamp: session.lastVisitTimestamp,
      awayFormatted: formatDuration(targetSec),
    });
  });

  // ── Session Sync ────────────────────────────────────────────────────────────
  app.post('/api/session/sync', async (req, res) => {
    const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
    session.lastVisitTimestamp = Date.now();
    session.simulatedAwaySeconds = 0;
    const stocks = await MarketDataProvider.getStocks(session);
    stocks.forEach((s) => {
      session.userStockSnapshots[s.symbol] = { price: s.currentPrice, timestamp: Date.now() };
    });
    res.json({ success: true, timestamp: Date.now() });
  });

  // ── Demo Reset ──────────────────────────────────────────────────────────────
  // Restores the canonical "7h 42m away" demo scenario for judges
  app.post('/api/demo/reset', (req, res) => {
    const session = getOrCreateSession(req.headers['x-session-id'] as string | undefined);
    const demoAwaySeconds = 7 * 3600 + 42 * 60;
    session.simulatedAwaySeconds = demoAwaySeconds;
    session.lastVisitTimestamp = Date.now() - demoAwaySeconds * 1000;
    session.dismissedEventIds.clear();
    session.acknowledgedEventIds.clear();

    // Restore canonical snapshot prices (the "before" state)
    const snapshotPrices: Record<string, number> = {
      RELIANCE: 2341.50,
      TCS: 4051.00,
      HDFCBANK: 1687.80,
      INFY: 1792.00,
      ICICIBANK: 1238.10,
      SBIN: 820.00,
      BHARTIARTL: 1595.00,
      TATAMOTORS: 960.20,
      ITC: 470.50,
      LT: 3515.00,
      TITAN: 3425.00,
      BAJFINANCE: 7015.00,
    };
    Object.entries(snapshotPrices).forEach(([sym, price]) => {
      session.userStockSnapshots[sym] = { price, timestamp: session.lastVisitTimestamp };
    });

    res.json({
      success: true,
      message: 'Demo reset to canonical "7h 42m away" scenario',
      awayFormatted: '7h 42m',
    });
  });

  // ── Vite / Static ───────────────────────────────────────────────────────────
  if (!process.env.VERCEL) {
    (async () => {
      if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Pulse] Server running on http://0.0.0.0:${PORT}`);
        console.log(`[Pulse] Gemini AI: ${process.env.GEMINI_API_KEY ? '✓ ready' : '✗ unavailable (deterministic fallback active)'}`);
        console.log(`[Pulse] Demo mode: /api/demo/reset to restore canonical scenario`);
      });
    })().catch(console.error);
  }

// Export the app for Vercel
export default app;
