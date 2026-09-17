"use client";
import { useDesk } from "@/lib/desk";
import Equation from "@/components/Equation";
import { fmtBps } from "@/lib/parity";
import { fmtET } from "@/lib/time";

const C = { pass: "var(--color-pass)", watch: "var(--color-warn)", fail: "var(--color-fail)" } as const;
const WORD = { pass: "holds", watch: "drifting", fail: "violated" } as const;

export default function Board() {
  const { readings, sel, setSel, win, index, updated, loading, err } = useDesk();
  const shown = readings.find((r) => r.rel.name === sel) ?? readings[0];
  const bad = readings.filter((r) => r.severity !== "pass").length;

  return (
    <main className="max-w-[1180px] mx-auto px-5 md:px-8 pb-14">
      <header className="pt-10 pb-6 rule-b flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.025em] leading-none">Board</h1>
          <p className="text-[13.5px] text-[var(--color-ink-2)] mt-2 max-w-[54ch]">
            Every identity the venue&apos;s own quotes are required to satisfy, checked against the live book.
          </p>
        </div>
        <span className="flex-1" />
        <Stat k="identities breaking" v={readings.length ? `${bad} of ${readings.length}` : "—"}
              c={bad ? "var(--color-fail)" : "var(--color-pass)"} />
        <Stat k="typical violation" v={index !== null ? `${index.toFixed(1)} bps` : "—"} />
        <Stat k={win?.active ? "window" : "showing"}
              v={win ? (win.active ? `${(win.elapsed * 100).toFixed(0)}% through` : `close of ${fmtET(win.end, { month: "short", day: "numeric" })}`) : "—"} />
      </header>

      {err && <p className="mt-4 text-[13px]" style={{ color: "var(--color-fail)" }}>{err}</p>}

      {win && !win.active && (
        <p className="mt-4 text-[12.5px] text-[var(--color-ink-2)] sheet px-4 py-3">
          A US venue is open right now, so these quotes have a market behind them and the identities are
          enforced. Below is the book as it stood at the end of the last dark window.
        </p>
      )}

      <section className="mt-5">{shown ? <Equation r={shown} /> : <div className="sheet h-[184px]" />}</section>

      <section className="sheet mt-4 overflow-x-auto no-scrollbar">
        <table className="ledger text-[13px] min-w-[720px]">
          <thead>
            <tr className="cap" style={{ background: "var(--color-card)" }}>
              <th>pair</th>
              <th>identity</th>
              <th className="!text-right">off by</th>
              <th className="!text-right">normal for this pair</th>
              <th className="!text-right">breaks this often</th>
              <th className="!text-right">verdict</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => {
              const on = r.rel.name === shown?.rel.name;
              return (
                <tr key={r.rel.name} onClick={() => setSel(r.rel.name)}
                    className="cursor-pointer"
                    style={on ? { background: "var(--mark-wash)" } : undefined}>
                  <td className="num font-medium whitespace-nowrap">r{r.rel.leg}<span className="text-[var(--color-ink-3)]">/</span>r{r.rel.base}</td>
                  <td className="num text-[12px] text-[var(--color-ink-2)] whitespace-nowrap">
                    {r.rel.beta > 0 ? `${r.rel.beta}×` : `${r.rel.beta}×`} the index
                  </td>
                  <td className="num !text-right" style={{ color: C[r.severity] }}>{fmtBps(r.residualBps)}</td>
                  <td className="num !text-right text-[var(--color-ink-2)]">±{r.rel.dark_p90.toFixed(0)}</td>
                  <td className="num !text-right text-[var(--color-ink-2)]">{r.rel.breach_20.toFixed(0)}%</td>
                  <td className="!text-right">
                    <span className="stamp" style={{ color: C[r.severity] }}>{WORD[r.severity]}</span>
                  </td>
                </tr>
              );
            })}
            {!readings.length && (
              <tr><td colSpan={6} className="cap py-10 text-center">{loading ? "reading the book…" : "no data"}</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="cap mt-4">
        off by = what is left after the identity · normal = this pair&apos;s own 90th percentile night
        {updated && ` · updated ${fmtET(updated)} ET`}
      </p>
    </main>
  );
}

const Stat = ({ k, v, c }: { k: string; v: string; c?: string }) => (
  <div>
    <div className="cap">{k}</div>
    <div className="num text-[18px] mt-0.5" style={c ? { color: c } : undefined}>{v}</div>
  </div>
);
