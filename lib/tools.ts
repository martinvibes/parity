/**
 * The tools the analyst may call. Each one hits Bitget's public market API —
 * no key, no account — so every number the model quotes came from the venue
 * rather than from its own memory.
 */
const BASE = "https://api.bitget.com";

const ALIAS: Record<string, string> = {
  BITCOIN: "BTC", ETHEREUM: "ETH", SOLANA: "SOL", RIPPLE: "XRP", XRP: "XRP",
  DOGECOIN: "DOGE", CARDANO: "ADA", POLKADOT: "DOT", AVALANCHE: "AVAX",
  CHAINLINK: "LINK", POLYGON: "MATIC", LITECOIN: "LTC", TONCOIN: "TON",
  APPLE: "RAAPL", TESLA: "RTSLA", NVIDIA: "RNVDA", MICROSOFT: "RMSFT",
  AMAZON: "RAMZN", GOOGLE: "RGOOGL", META: "RMETA",
};

/** "sol" -> SOLUSDT · "rAAPL" -> RAAPLUSDT · "SOLUSDT" -> SOLUSDT */
export function resolve(raw: string): string {
  let s = (raw || "").trim().toUpperCase().replace(/[^A-Z0-9.]/g, "");
  if (ALIAS[s]) s = ALIAS[s];
  if (s.endsWith("USDT")) return s;
  return `${s}USDT`;
}

async function bitget<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const r = await fetch(`${BASE}${path}?${q}`, { cache: "no-store" });
  const j = await r.json();
  if (j.code !== "00000") throw new Error(j.msg || "bitget rejected the request");
  return j.data as T;
}

type T24 = {
  symbol: string; lastPr: string; change24h: string; high24h: string;
  low24h: string; open: string; usdtVolume: string;
};

export const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_price",
      description:
        "Live price and 24h statistics for any asset trading on Bitget spot — crypto (SOL, BTC, ETH…) " +
        "or a tokenized US equity (rAAPL, rTSLA, rNVDA…). Use this for any 'what is X trading at' question.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Ticker or name, e.g. 'SOL', 'bitcoin', 'rAAPL', 'SOLUSDT'." },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_recent_candles",
      description:
        "Recent OHLC bars for an asset, for questions about trend, range or how something has moved. " +
        "Returns at most 48 bars, oldest first.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Ticker or name." },
          granularity: { type: "string", enum: ["15min", "1h", "4h", "1day"], description: "Bar size. Default 1h." },
          limit: { type: "number", description: "How many bars, max 48. Default 24." },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_top_movers",
      description: "The largest 24h movers on Bitget spot, by percentage. Use for 'what is moving' questions.",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["gainers", "losers"], description: "Default gainers." },
          limit: { type: "number", description: "How many, max 10. Default 5." },
        },
      },
    },
  },
] as const;

export async function runTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    if (name === "get_price") {
      const symbol = resolve(String(args.symbol ?? ""));
      const d = await bitget<T24[]>("/api/v2/spot/market/tickers", { symbol });
      const t = d?.[0];
      if (!t) return { error: `Bitget does not list ${symbol}.` };
      return {
        symbol: t.symbol,
        price: +t.lastPr,
        change_24h_pct: +(+t.change24h * 100).toFixed(2),
        high_24h: +t.high24h,
        low_24h: +t.low24h,
        turnover_24h_usd: Math.round(+t.usdtVolume),
      };
    }

    if (name === "get_recent_candles") {
      const symbol = resolve(String(args.symbol ?? ""));
      const granularity = String(args.granularity ?? "1h");
      const limit = Math.min(48, Math.max(2, Number(args.limit ?? 24)));
      const rows = await bitget<string[][]>("/api/v2/spot/market/candles", { symbol, granularity, limit });
      return {
        symbol, granularity,
        bars: rows.map((r) => ({
          t: new Date(+r[0]).toISOString(),
          o: +r[1], h: +r[2], l: +r[3], c: +r[4],
        })),
      };
    }

    if (name === "get_top_movers") {
      const dir = String(args.direction ?? "gainers");
      const limit = Math.min(10, Math.max(1, Number(args.limit ?? 5)));
      const all = await bitget<T24[]>("/api/v2/spot/market/tickers");
      // Thin books produce meaningless percentages; require real turnover.
      const liquid = all.filter((t) => +t.usdtVolume > 2e6 && t.symbol.endsWith("USDT"));
      liquid.sort((a, b) => (dir === "losers" ? +a.change24h - +b.change24h : +b.change24h - +a.change24h));
      return liquid.slice(0, limit).map((t) => ({
        symbol: t.symbol,
        price: +t.lastPr,
        change_24h_pct: +(+t.change24h * 100).toFixed(2),
        turnover_24h_usd: Math.round(+t.usdtVolume),
      }));
    }

    return { error: `Unknown tool ${name}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The market endpoint did not answer." };
  }
}
