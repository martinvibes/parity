"use client";
import { motion } from "framer-motion";
import { Download, Github } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Orbs from "@/components/Orbs";
import { useDesk } from "@/lib/desk";

const fadeInUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };

export default function Evidence() {
  const { audit } = useDesk();
  const rels = audit?.relations ?? [];
  const cov = Object.entries(audit?.coverage_by_year ?? {});
  const h = audit?.headline;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Orbs />
      <main className="relative z-10 container-custom pt-8 pb-20">

        <motion.header variants={fadeInUp} initial="hidden" animate="show" className="pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Evidence</h1>
          <p className="text-gray-400 text-sm mt-3 max-w-[64ch] leading-relaxed">
            Every hour of every night in {audit?.study_from ?? 2026}, graded against the identity.
            {h && <> {h.observations.toLocaleString()} observations across {h.relations} pairs.</>}{" "}
            Figures in basis points; lower is tighter.
          </p>
        </motion.header>

        <Section n="01" t="When the overnight book started being quoted"
                 s="An identity can only be checked when both legs are actually quoted. Before 2025 the dark window is empty, which is why the study starts where it does — and why nobody has audited this yet.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cov.map(([y, v]) => (
              <GlassCard key={y} className="p-5">
                <div className="label-xs">{y}</div>
                <div className={`tnum text-3xl font-bold mt-1.5 ${v > 50 ? "text-white" : "text-gray-600"}`}>{v}%</div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-3">
                  <div className="h-full rounded-full bg-white/70" style={{ width: `${v}%`, opacity: v > 50 ? 1 : 0.4 }} />
                </div>
                <div className="label-xs mt-2.5">of dark hours quoted</div>
              </GlassCard>
            ))}
            {!cov.length && <GlassCard className="p-5 col-span-4"><span className="label-xs">loading…</span></GlassCard>}
          </div>
        </Section>

        <Section n="02" t="How often each identity breaks"
                 s="Session is the same arithmetic measured inside US hours, where arbitrage enforces it. Treat it as a floor on measurement noise rather than a clean control: hourly sampling across two legs in a fast market manufactures some residual of its own. The headline here is the absolute breach rate, not the ratio.">
          <Table head={["pair", "required", "nights", "session", "dark", ">20 bps", "p99", "worst"]} min={760}>
            {rels.map((r) => (
              <tr key={r.name} className="border-t border-white/[0.07] hover:bg-white/[0.03] transition-colors">
                <Td className="font-medium whitespace-nowrap">r{r.leg}/r{r.base}</Td>
                <Td dim>{r.beta}×</Td>
                <Td r dim>{r.n_days}</Td>
                <Td r dim>{r.session_p50.toFixed(1)}</Td>
                <Td r>{r.dark_p50.toFixed(1)}</Td>
                <Td r bold={r.breach_20 > 40}>{r.breach_20.toFixed(1)}%</Td>
                <Td r dim>{r.dark_p99.toFixed(0)}</Td>
                <Td r dim>{r.dark_max.toFixed(0)}</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section n="03" t="The trade we did not find"
                 s="If a breach closed by morning it would be an arbitrage. We entered every reading past 40 bps and held to the open. Capture is what the breach gave back; cost is two sides of taker fee on gross notional — four dollars working per dollar of signal on a 3× pair, two on a mirror.">
          <Table head={["pair", "+1h", "+3h", "to the open", "n", "costs", "net"]} min={640}>
            {rels.filter((r) => r.persistence["8"]).map((r) => {
              const p = r.persistence["8"];
              const net = p.mean_bps - r.cost_round_trip_bps;
              return (
                <tr key={r.name} className="border-t border-white/[0.07] hover:bg-white/[0.03] transition-colors">
                  <Td className="font-medium whitespace-nowrap">r{r.leg}/r{r.base}</Td>
                  <Td r dim>{fmt(r.persistence["1"]?.mean_bps)}</Td>
                  <Td r dim>{fmt(r.persistence["3"]?.mean_bps)}</Td>
                  <Td r>{fmt(p.mean_bps)}</Td>
                  <Td r dim>{p.n}</Td>
                  <Td r dim>−{r.cost_round_trip_bps.toFixed(0)}</Td>
                  <Td r bold>{fmt(net)}</Td>
                </tr>
              );
            })}
          </Table>
          <GlassCard variant="heavy" className="p-6 mt-4">
            <p className="text-sm text-gray-300 leading-relaxed max-w-[70ch]">
              Every net column is negative. The breach is real, it is measurable, and it is{" "}
              <span className="text-white font-medium">not a trade</span> — which is exactly why it belongs in a
              pre-trade check rather than a strategy. You do not harvest these. You avoid paying them.
            </p>
          </GlassCard>
        </Section>

        <Section n="04" t="It is not stale prints"
                 s="The obvious objection: a wide reading is just an hour where one leg did not trade. Median turnover inside the leg's own bar, split by how wide the reading was. Wide bars are as busy as quiet ones, or busier.">
          <Table head={["pair", "quiet bars (<20 bps)", "wide bars (≥60 bps)"]} min={520}>
            {rels.filter((r) => r.volume.quiet && r.volume.wide).map((r) => (
              <tr key={r.name} className="border-t border-white/[0.07] hover:bg-white/[0.03] transition-colors">
                <Td className="font-medium whitespace-nowrap">r{r.leg}/r{r.base}</Td>
                <Td r dim>${(r.volume.quiet / 1e3).toFixed(0)}k</Td>
                <Td r bold={r.volume.wide >= r.volume.quiet}>${(r.volume.wide / 1e3).toFixed(0)}k</Td>
              </tr>
            ))}
          </Table>
        </Section>

        <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                    className="flex flex-wrap gap-3 mt-10">
          <a href="/audit.json" download
             className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-black font-semibold text-[13px] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all hover:scale-105">
            <Download size={15} /> audit.json — every figure on this site
          </a>
          <a href="https://github.com/martinvibes/parity" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-[13px] hover:bg-white/10 hover:border-white/40 transition-all">
            <Github size={15} /> the scripts that produced it
          </a>
        </motion.div>
      </main>
    </div>
  );
}

const fmt = (v?: number) => (v == null ? "—" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`);

const Section = ({ n, t, s, children }: { n: string; t: string; s: string; children: React.ReactNode }) => (
  <motion.section variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
                  className="py-8 border-t border-white/10">
    <div className="flex items-baseline gap-3">
      <span className="tnum text-[11px] text-gray-600">{n}</span>
      <h2 className="text-xl md:text-2xl font-bold tracking-tighter">{t}</h2>
    </div>
    <p className="text-[13.5px] text-gray-400 leading-relaxed mt-2.5 mb-5 pl-[30px] max-w-[74ch]">{s}</p>
    {children}
  </motion.section>
);

const Table = ({ head, min, children }: { head: string[]; min: number; children: React.ReactNode }) => (
  <GlassCard className="p-0 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" style={{ minWidth: min }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`label-xs font-normal px-4 py-3.5 ${i === 0 ? "text-left" : i === 1 && head[1] === "required" ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
          {!Array.isArray(children) || !children.length ? null : null}
        </tbody>
      </table>
    </div>
  </GlassCard>
);

const Td = ({ children, r, dim, bold, className = "" }:
  { children: React.ReactNode; r?: boolean; dim?: boolean; bold?: boolean; className?: string }) => (
  <td className={`tnum px-4 py-3 ${r ? "text-right" : ""} ${dim ? "text-gray-500" : bold ? "text-white font-medium" : "text-gray-200"} ${className}`}>
    {children}
  </td>
);
