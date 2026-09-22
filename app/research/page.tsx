"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Sparkles, Wrench } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Chart, { type Bar } from "@/components/Chart";
import { recent } from "@/lib/bitget";
import { useDesk } from "@/lib/desk";
import { deskState } from "@/lib/state";
import { pageVariants, fadeInUp, staggerContainer } from "@/lib/animations";

const TF = [["15min", "15m"], ["1h", "1H"], ["4h", "4H"], ["1day", "1D"]] as const;
const SUGGEST = [
  "What's the price of SOL right now?",
  "Which identity is furthest out of line tonight?",
  "What are the biggest movers today?",
  "How has rNVDA moved over the last day?",
  "Why can't I arbitrage the SOXS/SOXX gap?",
];

type Turn = { q: string; a?: string; tools?: { name: string; args: Record<string, unknown> }[]; err?: string };

export default function Research() {
  const { audit, win, readings } = useDesk();
  const [sym, setSym] = useState("SOLUSDT");
  const [draft, setDraft] = useState("SOLUSDT");
  const [tf, setTf] = useState<string>("1h");
  const [bars, setBars] = useState<Bar[]>([]);
  const [meta, setMeta] = useState<{ price: number; chg: number } | null>(null);

  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const feed = useRef<HTMLDivElement>(null);

  const state = useMemo(() => deskState(audit, win, readings), [audit, win, readings]);

  useEffect(() => {
    let live = true;
    setBars([]);
    recent(sym, tf, 200)
      .then((cs) => {
        if (!live) return;
        setBars(cs.map((c) => ({ time: Math.floor(c.t / 1000), open: c.o, high: c.h, low: c.l, close: c.c })));
        const first = cs[0], last = cs.at(-1);
        if (first && last) setMeta({ price: last.c, chg: (last.c / first.o - 1) * 100 });
      })
      .catch(() => live && setBars([]));
    return () => { live = false; };
  }, [sym, tf]);

  useEffect(() => { feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" }); }, [turns, busy]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    setQ("");
    setTurns((t) => [...t, { q: question }]);
    setBusy(true);
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, state }),
      });
      const d = await r.json();
      setTurns((t) => t.map((x, i) => (i === t.length - 1
        ? { ...x, a: d.text, tools: d.tools, err: d.error }
        : x)));
    } catch {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, err: "Could not reach the analyst." } : x)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.main variants={pageVariants} initial="initial" animate="animate" className="container-custom pb-16">
      <motion.header variants={staggerContainer} initial="hidden" animate="show" className="py-8">
        <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-bold tracking-tighter">
          Research
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-neon-secondary mt-3 max-w-[64ch]">
          Ask anything — a live price, what is moving, or what the audit says about tonight&apos;s board. The
          analyst calls Bitget&apos;s market API for prices rather than answering from memory.
        </motion.p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── chart ─────────────────────────────────────────────────────── */}
        <GlassCard className="lg:col-span-7 p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <form onSubmit={(e) => { e.preventDefault(); setSym(draft.trim().toUpperCase()); }} className="flex gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)}
                     className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm w-[140px] outline-none focus:border-white/40 transition-colors tnum"
                     placeholder="SOLUSDT" />
              <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-sm hover:bg-white/20 transition-colors">
                Load
              </button>
            </form>
            <span className="flex-1" />
            {meta && (
              <div className="flex items-baseline gap-2">
                <span className="tnum text-xl font-semibold">
                  {meta.price.toLocaleString("en-US", { maximumFractionDigits: meta.price < 10 ? 4 : 2 })}
                </span>
                <span className="tnum text-[13px]" style={{ color: meta.chg >= 0 ? "#fff" : "#71717a" }}>
                  {meta.chg >= 0 ? "+" : ""}{meta.chg.toFixed(2)}%
                </span>
              </div>
            )}
            <div className="flex gap-1 bg-black/40 border border-white/10 rounded-full p-1">
              {TF.map(([v, label]) => (
                <button key={v} onClick={() => setTf(v)}
                        className={`px-3 py-1 rounded-full text-[12px] transition-colors ${tf === v ? "bg-white text-black font-semibold" : "text-gray-400 hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Chart bars={bars} height={400} />
          <p className="label-xs mt-3">{sym} · bitget spot · live ohlc</p>
        </GlassCard>

        {/* ── analyst ───────────────────────────────────────────────────── */}
        <GlassCard className="lg:col-span-5 flex flex-col" hoverEffect={false}>
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <Sparkles size={15} className="text-white" />
            <span className="font-semibold text-sm">Analyst</span>
            <span className="label-xs ml-auto">live market tools</span>
          </div>

          <div ref={feed} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 max-h-[420px] min-h-[300px]">
            {!turns.length && (
              <div className="space-y-2">
                <p className="label-xs mb-3">try one of these</p>
                {SUGGEST.map((s) => (
                  <button key={s} onClick={() => ask(s)}
                          className="block w-full text-left text-[13px] text-gray-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/25 rounded-xl px-3.5 py-2.5 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {turns.map((t, i) => (
              <div key={i} className="space-y-2.5">
                <p className="text-[14px] font-medium">{t.q}</p>
                {t.tools?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {t.tools.map((tool, j) => (
                      <span key={j} className="inline-flex items-center gap-1.5 label-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                        <Wrench size={9} /> {tool.name}
                        {typeof tool.args.symbol === "string" && ` · ${tool.args.symbol}`}
                      </span>
                    ))}
                  </div>
                ) : null}
                {t.a && <p className="text-[13.5px] text-gray-300 leading-relaxed whitespace-pre-wrap">{t.a}</p>}
                {t.err && <p className="text-[13px] text-neon-secondary">{t.err}</p>}
                {!t.a && !t.err && busy && i === turns.length - 1 && (
                  <span className="inline-flex items-center gap-2 label-xs"><Loader2 size={11} className="animate-spin" /> reading the market…</span>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(q); }}
                className="p-3 border-t border-white/10 flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} disabled={busy}
                   placeholder="What's the price of SOL?"
                   className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none focus:border-white/40 transition-colors disabled:opacity-50" />
            <button type="submit" disabled={busy || !q.trim()}
                    className="w-10 h-10 grid place-items-center rounded-xl bg-white text-black disabled:opacity-30 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all shrink-0">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={16} />}
            </button>
          </form>
        </GlassCard>
      </div>
    </motion.main>
  );
}
