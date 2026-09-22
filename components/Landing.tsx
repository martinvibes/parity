"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Activity, ShieldAlert, Scale, LineChart } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Orbs from "@/components/Orbs";
import { useDesk } from "@/lib/desk";
import { fmtBps } from "@/lib/parity";

const fadeInUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } } };
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } } };

export default function Landing() {
  const { audit, readings, index, win } = useDesk();
  const h = audit?.headline;
  const top = readings[0];
  const broken = readings.filter((r) => r.severity !== "pass").length;

  return (
    <div className="min-h-screen bg-black text-white relative w-full overflow-x-hidden">
      <main className="relative z-10 w-full overflow-hidden">

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative min-h-[82vh] flex items-center overflow-hidden">
          <Orbs />
          <div className="relative z-10 w-full px-6 md:px-12 lg:px-24 pt-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">

              <motion.div variants={stagger} initial="hidden" animate="show"
                          className="flex flex-col space-y-6 text-center lg:text-left max-w-xl shrink-0">
                <motion.div variants={fadeInUp}
                            className="inline-flex items-center gap-2 self-center lg:self-start rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="label-xs !text-white">
                    {win?.active ? "market dark · live" : "us open · last close"}
                  </span>
                </motion.div>

                <div className="relative">
                  <motion.h1 variants={fadeInUp}
                             className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] relative z-10">
                    Three prices.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-600">
                      One truth.{" "}
                    </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/60 to-white/10">
                      No agreement.
                    </span>
                  </motion.h1>

                  <svg viewBox="0 0 500 50" fill="none" xmlns="http://www.w3.org/2000/svg"
                       className="absolute bottom-[-20px] left-0 w-[90%] h-auto z-0 pointer-events-none">
                    <defs>
                      <linearGradient id="curve-grad" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="white" stopOpacity="0.7" />
                        <stop offset="50%" stopColor="white" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M2 30 C 120 8, 300 8, 498 26" stroke="url(#curve-grad)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <motion.p variants={fadeInUp} className="text-gray-400 text-base md:text-lg leading-relaxed pt-3">
                  SOXL is built to move exactly three times SOXX. For eight hours a night Bitget quotes both
                  with no venue behind either — and they stop agreeing.{" "}
                  <span className="text-white font-medium">
                    {h ? `${h.share_outside_20bps}% of the time they are more than 20 basis points apart.`
                       : "We checked every hour of 180 nights."}
                  </span>
                </motion.p>

                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                  <Link href="/board"
                        className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105">
                    Open the board
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/research"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                    Ask the analyst
                  </Link>
                </motion.div>
              </motion.div>

              {/* live proof panel */}
              <motion.div variants={scaleIn} initial="hidden" animate="show" className="flex-1 mt-14 lg:mt-0 w-full">
                <GlassCard variant="heavy" className="p-6 md:p-7">
                  <div className="flex items-center justify-between mb-5">
                    <span className="label-xs">worst identity right now</span>
                    <span className="label-xs">{win?.active ? "live" : "last close"}</span>
                  </div>

                  {top ? (
                    <>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-2xl md:text-3xl font-bold tnum">r{top.rel.leg}</span>
                        <span className="text-gray-500 text-sm">must move</span>
                        <span className="text-2xl md:text-3xl font-bold tnum">{top.rel.beta}×</span>
                        <span className="text-gray-500 text-sm">r{top.rel.base}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-7">
                        <Fig k="index moved" v={`${(top.baseRet * 100).toFixed(2)}%`} />
                        <Fig k="so it must be" v={`${(top.required * 100).toFixed(2)}%`} dim />
                        <Fig k="it actually is" v={`${(top.legRet * 100).toFixed(2)}%`} />
                      </div>

                      <div className="mt-7 pt-5 border-t border-white/10 flex items-end justify-between gap-4">
                        <div>
                          <span className="label-xs">left over</span>
                          <div className="text-4xl md:text-5xl font-bold tnum leading-none mt-1">
                            {fmtBps(top.residualBps)}
                            <span className="text-base text-gray-500 ml-1.5">bps</span>
                          </div>
                        </div>
                        <span className="text-[11px] uppercase tracking-widest border border-white/25 px-2.5 py-1 rounded">
                          {top.severity === "fail" ? "violated" : top.severity === "watch" ? "drifting" : "holds"}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-gray-500 mt-4 leading-relaxed">
                        One of those two quotes is wrong. The arithmetic does not say which.
                      </p>
                    </>
                  ) : (
                    <div className="h-[260px] grid place-items-center label-xs">reading the book…</div>
                  )}
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════ NUMBERS ═══════════ */}
        <section className="px-6 md:px-12 lg:px-24 py-14">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
                      className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat v={index !== null ? index.toFixed(1) : "—"} u="bps" k="typical violation now" />
            <Stat v={readings.length ? `${broken}/${readings.length}` : "—"} k="identities breaking" />
            <Stat v={h ? `${h.share_outside_20bps}%` : "—"} k="of all nights past 20 bps" />
            <Stat v={h ? String(Math.round(h.widest)) : "—"} u="bps" k="widest ever measured" />
          </motion.div>
        </section>

        {/* ═══════════ WHAT IT DOES ═══════════ */}
        <section className="px-6 md:px-12 lg:px-24 py-10">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                     className="text-3xl md:text-4xl font-bold tracking-tighter mb-3">
            What Parity does
          </motion.h2>
          <motion.p variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                    className="text-gray-400 max-w-[62ch] mb-9">
            Not a forecast. An identity, checked against the venue&apos;s own quotes, and graded against 180
            measured nights.
          </motion.p>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Feature icon={<Scale size={22} />} title="The identity, not a model"
                     body="A leveraged ETF is contractually built to deliver a fixed multiple of its index. Measured from a common anchor within one session, that is arithmetic. There is no fair value to argue with." />
            <Feature icon={<Activity size={22} />} title="Graded, not asserted"
                     body={`Every reading is scored against this pair's own measured night. ${h ? `${h.observations.toLocaleString()} hourly observations` : "Fifteen thousand observations"} across ~180 nights in 2026, all of it downloadable.`} />
            <Feature icon={<ShieldAlert size={22} />} title="The trade we did not find"
                     body="We entered every reading past 40 bps and held to the open. It never clears two sides of taker fee. These are defects you pay, not opportunities you take — which is the whole reason this is a pre-trade check." />
            <Feature icon={<LineChart size={22} />} title="An analyst with live hands"
                     body="Ask for a price, a mover, or a read on tonight's board. It calls Bitget's market API rather than answering from memory, and shows you which tool it reached for." />
          </motion.div>
        </section>

        {/* ═══════════ CTA ═══════════ */}
        <section className="px-6 md:px-12 lg:px-24 py-16">
          <GlassCard variant="heavy" className="p-9 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tighter">
              Before you take that fill at 2am
            </h2>
            <p className="text-gray-400 mt-4 max-w-[54ch] mx-auto">
              Check whether the venue&apos;s own arithmetic agrees with the price you are about to pay.
            </p>
            <Link href="/board"
                  className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105">
              See tonight&apos;s board <ArrowRight size={16} />
            </Link>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}

const Fig = ({ k, v, dim }: { k: string; v: string; dim?: boolean }) => (
  <div>
    <div className="label-xs truncate">{k}</div>
    <div className={`tnum text-lg md:text-xl mt-1 ${dim ? "text-gray-500" : "text-white"}`}>{v}</div>
  </div>
);

const Stat = ({ v, u, k }: { v: string; u?: string; k: string }) => (
  <motion.div variants={fadeInUp}>
    <GlassCard className="p-5">
      <div className="tnum text-3xl md:text-4xl font-bold leading-none">
        {v}{u && <span className="text-sm text-gray-500 ml-1.5">{u}</span>}
      </div>
      <div className="label-xs mt-2.5">{k}</div>
    </GlassCard>
  </motion.div>
);

const Feature = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
  <motion.div variants={fadeInUp}>
    <GlassCard className="p-7 h-full">
      <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 grid place-items-center mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-[13.5px] text-gray-400 leading-relaxed mt-2.5">{body}</p>
    </GlassCard>
  </motion.div>
);
