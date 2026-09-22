const BASE = "https://api.bitget.com";

export type Ticker = { symbol: string; lastPr: string; change24h: string; usdtVolume: string };
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const r = await fetch(`${BASE}${path}${q.toString() ? `?${q}` : ""}`, { cache: "no-store" });
  const j = await r.json();
  if (j.code !== "00000") throw new Error(j.msg || "bitget error");
  return j.data as T;
}

export const tickers = () => get<Ticker[]>("/api/v2/spot/market/tickers");

/** History needs an explicit endTime; without it the endpoint refuses. */
export async function candles(symbol: string, granularity = "1h", limit = 200): Promise<Candle[]> {
  const rows = await get<string[][]>("/api/v2/spot/market/history-candles", {
    symbol, granularity, endTime: Date.now(), limit,
  });
  return rows.map((r) => ({ t: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[6] }));
}

/** Bounded concurrency — the public endpoints rate-limit on burst. */
export async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      try { out[k] = await fn(items[k]); } catch { /* a missing leg is a missing leg */ }
    }
  }));
  return out;
}

/** Recent bars (not history) — used by the research chart. */
export async function recent(symbol: string, granularity = "1h", limit = 200): Promise<Candle[]> {
  const rows = await get<string[][]>("/api/v2/spot/market/candles", { symbol, granularity, limit });
  return rows.map((r) => ({ t: +r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[6] }));
}

export async function ticker(symbol: string): Promise<Ticker | null> {
  const d = await get<Ticker[]>("/api/v2/spot/market/tickers", { symbol });
  return d?.[0] ?? null;
}
