"use client";
import { useDesk } from "@/lib/desk";

export default function Evidence() {
  const { audit } = useDesk();
  const rels = audit?.relations ?? [];
  const cov = Object.entries(audit?.coverage_by_year ?? {});

  return (
    <main className="max-w-[1180px] mx-auto px-5 md:px-8 pb-14">
      <header className="pt-10 pb-6 rule-b">
        <h1 className="text-[26px] font-semibold tracking-[-0.025em] leading-none">Evidence</h1>
        <p className="text-[13.5px] text-[var(--color-ink-2)] mt-2 max-w-[62ch]">
          Every hour of every night in {audit?.study_from ?? 2026}, graded against the identity. Figures in
          basis points; lower is tighter.
        </p>
      </header>

      <Section n="01" t="When the overnight book started being quoted"
               s="The identities can only be checked when both legs are actually quoted. Before 2025 the dark window is empty, which is why the study starts where it does.">
        <div className="sheet flex flex-wrap">
          {cov.map(([y, v]) => (
            <div key={y} className="px-5 py-4 flex-1 min-w-[120px]" style={{ borderRight: "1px solid var(--color-rule)" }}>
              <div className="cap">{y}</div>
              <div className="num text-[26px] mt-1" style={{ color: v > 50 ? "var(--color-ink)" : "var(--color-ink-3)" }}>
                {v}%
              </div>
              <div className="gauge mt-2"><i style={{ width: `${v}%`, background: v > 50 ? "var(--color-mark)" : "var(--color-ink-3)" }} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section n="02" t="How often each identity breaks"
               s="Session is the same arithmetic measured inside US hours, where arbitrage enforces it. Treat it as a floor on measurement noise rather than a clean control: hourly sampling across two legs in a fast market manufactures some residual of its own.">
        <div className="sheet overflow-x-auto no-scrollbar">
          <table className="ledger text-[13px] min-w-[760px]">
            <thead>
              <tr className="cap">
                <th>pair</th><th>required</th>
                <th className="!text-right">nights</th>
                <th className="!text-right">session</th>
                <th className="!text-right">dark</th>
                <th className="!text-right">&gt;20 bps</th>
                <th className="!text-right">p99</th>
                <th className="!text-right">worst</th>
              </tr>
            </thead>
            <tbody>
              {rels.map((r) => (
                <tr key={r.name}>
                  <td className="num font-medium whitespace-nowrap">r{r.leg}/r{r.base}</td>
                  <td className="num text-[12px] text-[var(--color-ink-2)]">{r.beta}×</td>
                  <td className="num !text-right text-[var(--color-ink-2)]">{r.n_days}</td>
                  <td className="num !text-right text-[var(--color-ink-2)]">{r.session_p50.toFixed(1)}</td>
                  <td className="num !text-right">{r.dark_p50.toFixed(1)}</td>
                  <td className="num !text-right"
                      style={{ color: r.breach_20 > 40 ? "var(--color-fail)" : r.breach_20 > 20 ? "var(--color-warn)" : undefined }}>
                    {r.breach_20.toFixed(1)}%
                  </td>
                  <td className="num !text-right text-[var(--color-ink-2)]">{r.dark_p99.toFixed(0)}</td>
                  <td className="num !text-right text-[var(--color-ink-2)]">{r.dark_max.toFixed(0)}</td>
                </tr>
              ))}
              {!rels.length && <tr><td colSpan={8} className="cap py-10 text-center">loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n="03" t="The trade we did not find"
               s="If a breach closed by morning it would be an arbitrage. We entered every reading past 40 bps and held to the open. Capture is what the breach gave back; cost is two sides of taker fee on gross notional, which is four dollars working per dollar of signal on a 3× pair and two on a mirror.">
        <div className="sheet overflow-x-auto no-scrollbar">
          <table className="ledger text-[13px] min-w-[640px]">
            <thead>
              <tr className="cap">
                <th>pair</th>
                <th className="!text-right">+1h</th>
                <th className="!text-right">+3h</th>
                <th className="!text-right">to the open</th>
                <th className="!text-right">n</th>
                <th className="!text-right">costs</th>
                <th className="!text-right">net</th>
              </tr>
            </thead>
            <tbody>
              {rels.filter((r) => r.persistence["8"]).map((r) => {
                const p = r.persistence["8"];
                const net = p.mean_bps - r.cost_round_trip_bps;
                return (
                  <tr key={r.name}>
                    <td className="num font-medium whitespace-nowrap">r{r.leg}/r{r.base}</td>
                    <td className="num !text-right text-[var(--color-ink-2)]">{fmt(r.persistence["1"]?.mean_bps)}</td>
                    <td className="num !text-right text-[var(--color-ink-2)]">{fmt(r.persistence["3"]?.mean_bps)}</td>
                    <td className="num !text-right">{fmt(p.mean_bps)}</td>
                    <td className="num !text-right text-[var(--color-ink-3)]">{p.n}</td>
                    <td className="num !text-right text-[var(--color-ink-2)]">−{r.cost_round_trip_bps.toFixed(0)}</td>
                    <td className="num !text-right" style={{ color: net > 0 ? "var(--color-pass)" : "var(--color-fail)" }}>
                      {fmt(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[13.5px] text-[var(--color-ink-2)] leading-relaxed mt-4 max-w-[68ch]">
          Every net column is negative. The breach is real, it is measurable, and it is not a trade — which is
          exactly why it belongs in a pre-trade check rather than a strategy. You do not harvest these. You
          avoid paying them.
        </p>
      </Section>

      <Section n="04" t="It is not stale prints"
               s="The obvious objection: a wide reading is just an hour where one leg did not trade. Median turnover inside the leg's own bar, split by how wide the reading was.">
        <div className="sheet overflow-x-auto no-scrollbar">
          <table className="ledger text-[13px] min-w-[520px]">
            <thead>
              <tr className="cap">
                <th>pair</th>
                <th className="!text-right">quiet bars (&lt;20 bps)</th>
                <th className="!text-right">wide bars (≥60 bps)</th>
              </tr>
            </thead>
            <tbody>
              {rels.filter((r) => r.volume.quiet && r.volume.wide).map((r) => (
                <tr key={r.name}>
                  <td className="num font-medium whitespace-nowrap">r{r.leg}/r{r.base}</td>
                  <td className="num !text-right text-[var(--color-ink-2)]">${(r.volume.quiet / 1e3).toFixed(0)}k</td>
                  <td className="num !text-right"
                      style={{ color: r.volume.wide >= r.volume.quiet ? "var(--color-ink)" : "var(--color-ink-2)" }}>
                    ${(r.volume.wide / 1e3).toFixed(0)}k
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/audit.json" download className="link text-[13px]">audit.json — every figure on this site</a>
        <span className="cap">·</span>
        <a href="https://github.com/martinvibes/parity" className="link text-[13px]">the scripts that produced it</a>
      </div>
    </main>
  );
}

const fmt = (v?: number) => (v == null ? "—" : `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`);

const Section = ({ n, t, s, children }: { n: string; t: string; s: string; children: React.ReactNode }) => (
  <section className="py-8 rule-b">
    <div className="flex items-baseline gap-3">
      <span className="seq">{n}</span>
      <h2 className="text-[18px] font-semibold tracking-[-0.02em]">{t}</h2>
    </div>
    <p className="text-[13.5px] text-[var(--color-ink-2)] leading-relaxed mt-2 mb-4 pl-[26px] max-w-[72ch]">{s}</p>
    {children}
  </section>
);
