import { supabase } from '../lib/supabase';
import {
 Stock,
 MarketIndex,
 MarketEvent,
 Watchlist,
 MarketPulse,
 StockDetailExtended,
 FeedStatus
} from '../types';

// ── Generic fetch helper with error handling ────────────────────────────────
async function getAuthHeader() {
 const { data } = await supabase.auth.getSession();
 return data?.session?.access_token ? { 'Authorization': `Bearer ${data.session.access_token}` } : {};
}

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
 const headers = {
 ...options.headers,
 ...(await getAuthHeader())
 };
 const res = await fetch(url, { ...options, headers });
 if (!res.ok) {
 const body = await res.json().catch(() => ({}));
 throw new Error(body?.error || `HTTP ${res.status}`);
 }
 const json = await res.json();
 return json.data !== undefined ? json.data : json;
}

// ── API service layer ───────────────────────────────────────────────────────
export const api = {
 async getIndices(): Promise<MarketIndex[]> {
 return fetchJSON<MarketIndex[]>('/api/market/indices');
 },

 async getWatchlists(): Promise<{ watchlists: Watchlist[]; activeId: string }> {
 const headers = await getAuthHeader();
 const json = await fetch('/api/watchlists', { headers }).then(r => r.json());
 return { watchlists: json.data, activeId: json.activeId };
 },

 async createWatchlist(name: string, symbols: string[]): Promise<Watchlist> {
 return fetchJSON<Watchlist>('/api/watchlists', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, symbols }),
 });
 },

 async updateWatchlist(
 id: string,
 updates: { name?: string; symbols?: string[]; setActive?: boolean }
 ): Promise<Watchlist> {
 return fetchJSON<Watchlist>(`/api/watchlists/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(updates),
 });
 },

 async deleteWatchlist(id: string): Promise<string> {
 const headers = await getAuthHeader();
 const json = await fetch(`/api/watchlists/${id}`, { method: 'DELETE', headers }).then(r => r.json());
 return json.activeId;
 },

 async getStocks(watchlistId?: string): Promise<{ stocks: Stock[]; watchlist: Watchlist }> {
 const headers = await getAuthHeader();
 const url = watchlistId
 ? `/api/market/stocks?watchlistId=${encodeURIComponent(watchlistId)}`
 : '/api/market/stocks';
 const json = await fetch(url, { headers }).then(r => r.json());
 return { stocks: json.data, watchlist: json.watchlist };
 },

 async getAllStocks(): Promise<Stock[]> {
 return fetchJSON<Stock[]>('/api/market/stocks/all');
 },

 async getStockDetail(symbol: string): Promise<StockDetailExtended> {
 return fetchJSON<StockDetailExtended>(`/api/market/stocks/${encodeURIComponent(symbol)}`);
 },

 async getPulse(watchlistId?: string): Promise<MarketPulse> {
 const url = watchlistId
 ? `/api/market/pulse?watchlistId=${encodeURIComponent(watchlistId)}`
 : '/api/market/pulse';
 return fetchJSON<MarketPulse>(url);
 },

 async getEvents(watchlistId?: string): Promise<MarketEvent[]> {
 const url = watchlistId
 ? `/api/market/events?watchlistId=${encodeURIComponent(watchlistId)}`
 : '/api/market/events';
 return fetchJSON<MarketEvent[]>(url);
 },

 async acknowledgeEvent(id: string): Promise<void> {
 const headers = await getAuthHeader();
 await fetch(`/api/market/events/${encodeURIComponent(id)}/acknowledge`, { method: 'POST', headers });
 },

 async dismissEvent(id: string): Promise<void> {
 const headers = await getAuthHeader();
 await fetch(`/api/market/events/${encodeURIComponent(id)}/dismiss`, { method: 'POST', headers });
 },

 async searchStocks(q: string): Promise<Stock[]> {
 return fetchJSON<Stock[]>(`/api/market/search?q=${encodeURIComponent(q)}`);
 },

 async getFeedStatus(): Promise<FeedStatus> {
 return fetchJSON<FeedStatus>('/api/market/status');
 },

 async timeTravel(preset: string): Promise<{ simulatedAwaySeconds: number; lastVisitTimestamp: number }> {
 const headers = await getAuthHeader();
 const res = await fetch('/api/session/time-travel', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', ...headers },
 body: JSON.stringify({ preset }),
 });
 return res.json();
 },

 async syncSession(): Promise<void> {
 const headers = await getAuthHeader();
 await fetch('/api/session/sync', { method: 'POST', headers });
 },

 // ── Demo reset ────────────────────────────────────────────────────────────
 // Restores the canonical "7h 42m away" demo scenario
 async resetDemo(): Promise<void> {
 const headers = await getAuthHeader();
 await fetch('/api/demo/reset', { method: 'POST', headers });
 },

 // ── Gemini AI explanation ─────────────────────────────────────────────────
 // Sends computed facts → receives 1-sentence narrative.
 // Falls back gracefully if Gemini is unavailable.
 async getAIExplanation(facts: {
 symbol: string;
 name?: string;
 priceChangePct?: number;
 volumeMultiple?: number;
 crossed30dHigh?: boolean;
 crossedRecentLow?: boolean;
 gapReversal?: boolean;
 timeSinceLastSeen?: string;
 attentionScore?: number;
 }): Promise<{ narrative: string; source: 'gemini' | 'fallback' }> {
 try {
 const headers = await getAuthHeader();
 const res = await fetch('/api/ai/explain', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', ...headers },
 body: JSON.stringify({ facts }),
 });
 const json = await res.json();
 return { narrative: json.narrative, source: json.source ?? 'fallback' };
 } catch {
 return {
 narrative: `${facts.symbol} showed meaningful activity since your last visit.`,
 source: 'fallback',
 };
 }
 },
};
