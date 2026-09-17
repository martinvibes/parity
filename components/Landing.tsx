"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDesk } from "@/lib/desk";
import Equation from "@/components/Equation";

export default function Landing() {
  const { audit, readings, index, win } = useDesk();
  const h = audit?.headline;
  const top = readings[0];

  return (
    <main className="max-w-[1180px] mx-auto px-5 md:px-8">
      {/* ── masthead ─────────────────────────────────────────────────────── */}
      <section className="pt-12 md:pt-16 pb-9 rule-b">
        <div className="flex flex-wrap gap-x-10 gap-y-2 mb-9">
          <Field k="subject" v="Bitget rToken quote consistency" />
          <Field k="window" v="20:00 → 04:00 ET" />
          <Field k="period" v={audit ? `${audit.study_from} · ${audit.relations[0]?.n_days ?? "—"} nights` : "—"} />
          <Field k="observations" v={h ? h.observations.toLocaleString() : "—"} />
        </div>

        <h1 className="rise text-[clamp(34px,6.2vw,62px)] leading-[0.98] tracking-[-0.035em] font-semibold max-w-[15ch]">
          The venue disagrees with itself.
        </h1>

        <p className="rise text-[16px] md:text-[18px] text-[var(--color-ink-2)] leading-relaxed mt-6 max-w-[62ch]"
           style={{ animationDelay: "0.08s" }}>
          SOXL is built to move exactly three times SOXX. For eight hours a night Bitget quotes both, with no
          venue behind either — and they stop agreeing. We checked every hour of{" "}
          {audit ? audit.relations[0]?.n_days : 180} nights.{" "}
          <strong className="font-semibold text-[var(--color-ink)]">
            {h ? h.share_outside_20bps : "—"}% of the time the two quotes are more than 20 basis points apart.
          </strong>{" "}
          The widest was {h ? Math.round(h.widest) : "—"}.
        </p>

        <div className="rise flex flex-wrap items-center gap-3 mt-8" style={{ animationDelay: "0.16s" }}>
          <Link href="/board"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-medium"
                style={{ background: "var(--color-ink)", color: "var(--paper)" }}>
            See tonight&apos;s board <ArrowRight size={14} />
          </Link>
          <Link href="/evidence" className="link text-[13.5px] px-2 py-2.5">Read the evidence</Link>
          {index !== null && (
            <span className="ml-auto flex items-baseline gap-2">
              <span className="cap">{win?.active ? "live disagreement" : "at last close"}</span>
              <span className="num text-[19px]" style={{ color: index >= 20 ? "var(--color-fail)" : "var(--color-ink)" }}>
                {index.toFixed(1)}<span className="text-[11px] ml-0.5">bps</span>
              </span>
            </span>
          )}
        </div>
      </section>

      {/* ── the identity, worked live ─────────────────────────────────────── */}
      <section className="py-9 rule-b">
        <Head n="01" t="The argument, on tonight's quotes" />
        <p className="text-[14.5px] text-[var(--color-ink-2)] leading-relaxed max-w-[68ch] mb-5">
          A leveraged ETF is contractually built to deliver a fixed multiple of its index. Measured from a
          common anchor, that is arithmetic, not a forecast. Here it is on the pair furthest out of line right
          now.
        </p>
        {top ? <Equation r={top} /> : <div className="sheet h-[184px]" />}
      </section>

      {/* ── findings ─────────────────────────────────────────────────────── */}
      <section className="py-9 rule-b">
        <Head n="02" t="What we found" />
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--color-rule)" }}>
          <Finding n="01" t="The overnight book is new"
                   b={audit ? `Hourly coverage of the dark window went ${Object.entries(audit.coverage_by_year).map(([y, v]) => `${y}: ${v}%`).join(", ")}. Bitget switched this on recently, and nobody has audited it.` : ""} />
          <Finding n="02" t="One night in four breaks tolerance"
                   b={h ? `${h.share_outside_20bps}% of ${h.observations.toLocaleString()} observations sit more than 20 bps outside the identity. The semiconductor pairs are the worst: SOXS against SOXX breaks it 59.5% of the time.` : ""} />
          <Finding n="03" t="These are not stale prints"
                   b="The obvious objection is that a wide reading is just a bar nobody traded in. It isn't — turnover inside the wide bars is equal to or higher than inside the quiet ones. Real quotes, real volume, genuinely inconsistent." />
          <Finding n="04" t="You cannot arbitrage it"
                   b={h?.median_persistence_bps != null ? `We tried. A breach gives back a median ${h.median_persistence_bps} bps by the open, against ${audit?.fee_bps_per_side ?? 10} bps a side on gross notional. It does not clear costs. That is the point: these are defects you pay, not opportunities you take.` : ""} />
        </ol>
      </section>

      {/* ── use ──────────────────────────────────────────────────────────── */}
      <section className="py-9 pb-14">
        <Head n="03" t="What it is for" />
        <p className="text-[15px] leading-relaxed max-w-[68ch]">
          Before you put an order into an rToken at two in the morning, Parity tells you whether the venue&apos;s
          own arithmetic agrees with the price you are about to take — and, from 180 measured nights, whether
          that gap is likely to still be there when you try to get out.
        </p>
        <Link href="/board" className="inline-flex items-center gap-2 mt-6 link text-[14px]">
          Open the board <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  );
}

const Field = ({ k, v }: { k: string; v: string }) => (
  <div><div className="cap">{k}</div><div className="num text-[13px] mt-0.5">{v}</div></div>
);

const Head = ({ n, t }: { n: string; t: string }) => (
  <div className="flex items-baseline gap-3 mb-4">
    <span className="seq">{n}</span>
    <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{t}</h2>
  </div>
);

const Finding = ({ n, t, b }: { n: string; t: string; b: string }) => (
  <li className="px-5 py-5" style={{ background: "var(--color-card)" }}>
    <div className="flex items-baseline gap-3">
      <span className="seq">{n}</span>
      <h3 className="text-[15px] font-semibold tracking-[-0.015em]">{t}</h3>
    </div>
    <p className="text-[13.5px] text-[var(--color-ink-2)] leading-relaxed mt-2 pl-[26px]">{b}</p>
  </li>
);
