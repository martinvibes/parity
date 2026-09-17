"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { candles, pool, tickers, type Candle } from "@/lib/bitget";
import { anchorClose, read, rsymbol, type Audit, type Reading } from "@/lib/parity";
import { darkWindow, type Window } from "@/lib/time";

type Ctx = {
  audit: Audit | null;
  win: Window | null;
  readings: Reading[];
  index: number | null;          // the disagreement index, in bps
  sel: string | null;
  setSel: (s: string) => void;
  updated: Date | null;
  err: string | null;
  loading: boolean;
};

const C = createContext<Ctx | null>(null);
export const useDesk = () => {
  const v = useContext(C);
  if (!v) throw new Error("useDesk outside provider");
  return v;
};

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [win, setWin] = useState<Window | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);

  useEffect(() => {
    fetch("/audit.json").then((r) => r.json()).then(setAudit).catch(() => setErr("Could not load the audit."));
  }, []);

  const refresh = useCallback(async (a: Audit) => {
    const w = darkWindow(new Date());
    setWin(w);

    const names = Array.from(new Set(a.relations.flatMap((r) => [r.base, r.leg])));
    const ts = await tickers();
    const live: Record<string, number> = {};
    for (const t of ts) {
      const m = /^R(.+)USDT$/.exec(t.symbol);
      if (m) live[m[1]] = +t.lastPr;
    }

    const cs = await pool(names, 6, async (n) => [n, await candles(rsymbol(n), "1h", 200)] as [string, Candle[]]);
    const anchors: Record<string, number> = {};
    const replay: Record<string, number> = {};
    for (const row of cs) {
      if (!row) continue;
      const [n, k] = row;
      const anc = anchorClose(k, w.start);
      if (anc) anchors[n] = anc;
      // Outside the window there is nothing live to read, so show how the night ended.
      const last = k.filter((c) => c.t <= +w.end).at(-1);
      if (last) replay[n] = last.c;
    }

    const px = w.active ? live : { ...live, ...replay };
    const out = a.relations.map((r) => read(r, px, anchors)).filter(Boolean) as Reading[];
    out.sort((x, y) => Math.abs(y.residualBps) - Math.abs(x.residualBps));
    setReadings(out);
    setUpdated(new Date());
    setLoading(false);
    if (!seeded.current && out.length) { setSel(out[0].rel.name); seeded.current = true; }
  }, []);

  useEffect(() => {
    if (!audit) return;
    let live = true;
    const go = () => refresh(audit).catch(() => { if (live) { setErr("Bitget's market endpoint did not answer."); setLoading(false); } });
    go();
    const id = setInterval(go, 45_000);
    return () => { live = false; clearInterval(id); };
  }, [audit, refresh]);

  // One number for the whole book: the typical violation across every identity.
  const index = useMemo(() => {
    if (!readings.length) return null;
    const v = readings.map((r) => Math.abs(r.residualBps)).sort((a, b) => a - b);
    return v[v.length >> 1];
  }, [readings]);

  const value = useMemo<Ctx>(() => ({ audit, win, readings, index, sel, setSel, updated, err, loading }),
    [audit, win, readings, index, sel, updated, err, loading]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
