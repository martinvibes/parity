"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Orbs from "@/components/Orbs";
import { useDesk } from "@/lib/desk";
import { fmtBps, type Reading } from "@/lib/parity";
import { fmtET } from "@/lib/time";

const WORD = { pass: "holds", watch: "drifting", fail: "violated" } as const;
const fadeInUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };

/** How loud a reading should look, from its own measured night. */
const tone = (s: Reading["severity"]) =>
  s === "fail" ? "text-white border-white/60 bg-white/10"
  : s === "watch" ? "text-gray-300 border-white/25 bg-white/5"
  : "text-gray-500 border-white/10";

export default function BoardPage() {
  const { readings, sel, setSel, win, index, updated, loading, err } = useDesk();
  const shown = readings.find((r) => r.rel.name === sel) ?? readings[0];
  const bad = readings.filter((r) => r.severity !== "pass").length;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Orbs />
      <main className="relative z-10 container-custom pt-8 pb-20">

        <motion.header variants={stagger} initial="hidden" animate="show"
                       className="flex flex-wrap items-end gap-x-10 gap-y-5 pb-8">
          <motion.div variants={fadeInUp}>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Board</h1>
            <p className="text-gray-400 text-sm mt-2.5 max-w-[56ch]">
              Every identity the venue&apos;s own quotes are required to satisfy, checked against the live book
              every 45 seconds.
            </p>
          </motion.div>
          <span className="flex-1" />
          <motion.div variants={fadeInUp} className="flex gap-3 flex-wrap">
            <Stat k="identities breaking" v={readings.length ? `${bad}/${readings.length}` : "—"} />
            <Stat k="typical violation" v={index !== null ? index.toFixed(1) : "—"} u="bps" />
            <Stat k={win?.active ? "through window" : "showing"}
                  v={win ? (win.active ? `${(win.elapsed * 100).toFixed(0)}%` : fmtET(win.end, { month: "short", day: "numeric" })) : "—"} />
          </motion.div>
        </motion.header>

        {err && (
          <GlassCard className="p-4 mb-5"><p className="text-sm text-white">{err}</p></GlassCard>
        )}

        {win && !win.active && (
          <GlassCard className="p-4 mb-5">
            <p className="text-[12.5px] text-gray-400 leading-relaxed">
              A US venue is open right now, so these quotes have a market behind them and arbitrage enforces the
              identities. Below is the book as it stood at the end of the last dark window.
            </p>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── the list ── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="lg:col-span-7 space-y-3">
            {loading && !readings.length && (
              <GlassCard className="p-6"><span className="label-xs">reading the book…</span></GlassCard>
            )}
            {readings.map((r) => {
              const on = shown?.rel.name === r.rel.name;
              return (
                <motion.button key={r.rel.name} variants={fadeInUp} onClick={() => setSel(r.rel.name)}
                               className="w-full text-left block">
                  <GlassCard className={`p-4 md:p-5 transition-colors ${on ? "!border-white/40 !bg-white/[0.07]" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold tracking-tight">r{r.rel.leg}</span>
                          <span className="text-gray-600 text-xs">=</span>
                          <span className="tnum text-sm text-gray-400">{r.rel.beta}×</span>
                          <span className="font-semibold tracking-tight text-gray-300">r{r.rel.base}</span>
                          <span className="label-xs ml-1">{r.rel.kind}</span>
                        </div>
                        <div className="label-xs mt-1.5 truncate">
                          breaks 20 bps on {r.rel.breach_20.toFixed(0)}% of measured nights · p90 {r.rel.dark_p90.toFixed(0)} bps
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="tnum text-xl md:text-2xl font-bold leading-none">{fmtBps(r.residualBps)}</div>
                        <div className="label-xs mt-1">bps left over</div>
                      </div>

                      <span className={`shrink-0 text-[10px] uppercase tracking-widest border px-2 py-1 rounded ${tone(r.severity)}`}>
                        {WORD[r.severity]}
                      </span>
                    </div>

                    {/* violation against this pair's own p90 */}
                    <div className="mt-3.5 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-white/70 rounded-full transition-all duration-700"
                           style={{ width: `${Math.min(100, (Math.abs(r.residualBps) / Math.max(r.rel.dark_p90 * 2, 60)) * 100)}%` }} />
                    </div>
                  </GlassCard>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── the detail ── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 space-y-4">
              {shown ? <Detail r={shown} /> : <GlassCard className="p-6 h-[380px]"><span className="label-xs">reading…</span></GlassCard>}

              <GlassCard className="p-5">
                <div className="label-xs">not a signal</div>
                <p className="text-[13px] text-gray-400 leading-relaxed mt-2">
                  Holding $1 of the leg against ${Math.abs(shown?.rel.beta ?? 3).toFixed(0)} of the base moves{" "}
                  <span className="text-white tnum">{(shown?.rel.gross_multiple ?? 4).toFixed(0)}×</span> gross dollars
                  per dollar of signal, charged on both sides — about{" "}
                  <span className="text-white tnum">{(shown?.rel.cost_round_trip_bps ?? 80).toFixed(0)} bps</span>{" "}
                  round trip. We measured the capture and it does not clear that.
                </p>
                <Link href="/evidence"
                      className="inline-flex items-center gap-1.5 text-[12.5px] mt-3.5 text-white hover:gap-2.5 transition-all">
                  See the measurement <ArrowRight size={13} />
                </Link>
              </GlassCard>

              {updated && (
                <div className="label-xs text-center">
                  read {fmtET(updated, { hour: "numeric", minute: "2-digit", second: "2-digit" })} ET · bitget spot
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Detail({ r }: { r: Reading }) {
  const hours = r.rel.by_hour;
  const peak = Math.max(...hours.map((h) => h ?? 0), 1);

  return (
    <GlassCard variant="heavy" className="p-6">
      <div className="label-xs">the identity</div>
      <div className="flex items-baseline gap-2.5 flex-wrap mt-2">
        <span className="text-2xl font-bold tracking-tight">r{r.rel.leg}</span>
        <span className="text-gray-600">must move</span>
        <span className="text-2xl font-bold tnum">{r.rel.beta}×</span>
        <span className="text-2xl font-bold tracking-tight text-gray-400">r{r.rel.base}</span>
      </div>
      <p className="text-[12.5px] text-gray-500 mt-2.5 leading-relaxed">{r.rel.note}</p>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-6 pt-5 border-t border-white/10">
        <Row k={`r${r.rel.base} since 20:00`} v={`${(r.baseRet * 100).toFixed(3)}%`} />
        <Row k="so the leg must be" v={`${(r.required * 100).toFixed(3)}%`} dim />
        <Row k={`r${r.rel.leg} actually is`} v={`${(r.legRet * 100).toFixed(3)}%`} />
        <Row k="quotes now" v={`${r.basePx.toFixed(2)} / ${r.legPx.toFixed(2)}`} dim />
      </div>

      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="label-xs">left over</div>
        <div className="flex items-end gap-3 mt-1">
          <span className="tnum text-5xl font-bold leading-none">{fmtBps(r.residualBps)}</span>
          <span className="text-gray-500 text-sm mb-1">bps</span>
          <span className="flex-1" />
          <span className="label-xs mb-1">p90 is {r.rel.dark_p90.toFixed(0)}</span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="label-xs">where in the night it usually breaks</span>
          <span className="label-xs tnum">{r.rel.n_dark.toLocaleString()} obs</span>
        </div>
        <div className="flex items-end gap-1.5 h-16 mt-3">
          {hours.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-sm bg-white/70 transition-all"
                   style={{ height: `${Math.max(3, ((h ?? 0) / peak) * 46)}px`, opacity: h === null ? 0.15 : 1 }} />
              <span className="text-[9px] text-gray-600 tnum">{(20 + i) % 24}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

const Row = ({ k, v, dim }: { k: string; v: string; dim?: boolean }) => (
  <div>
    <div className="label-xs truncate">{k}</div>
    <div className={`tnum text-[15px] mt-1 ${dim ? "text-gray-500" : "text-white"}`}>{v}</div>
  </div>
);

const Stat = ({ k, v, u }: { k: string; v: string; u?: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
    <div className="label-xs">{k}</div>
    <div className="tnum text-lg mt-0.5">{v}{u && <span className="text-xs text-gray-500 ml-1">{u}</span>}</div>
  </div>
);
