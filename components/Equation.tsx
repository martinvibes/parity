"use client";
import { fmtBps, type Reading } from "@/lib/parity";

const C = { pass: "var(--color-pass)", watch: "var(--color-warn)", fail: "var(--color-fail)" } as const;
const pc = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(2)}%`;

/**
 * The identity, worked out on live quotes. This is the whole argument: the left
 * side is contractual, the right side is what Bitget is quoting, and the gap
 * between them needs no model to interpret.
 */
export default function Equation({ r, compact = false }: { r: Reading; compact?: boolean }) {
  const { rel } = r;
  const col = C[r.severity];
  const x = rel.beta < 0 ? `${rel.beta}×` : `${rel.beta}×`;

  return (
    <div className="sheet">
      <div className="rule-b px-4 md:px-5 py-3 flex items-center gap-3 flex-wrap">
        <span className="num text-[14px] font-semibold">r{rel.leg}</span>
        <span className="cap">must move</span>
        <span className="num text-[14px]" style={{ color: "var(--color-mark)" }}>{x}</span>
        <span className="cap">r{rel.base}</span>
        <span className="flex-1" />
        <span className="stamp" style={{ color: col }}>
          {r.severity === "fail" ? "violated" : r.severity === "watch" ? "drifting" : "holds"}
        </span>
      </div>

      <div className="px-4 md:px-5 py-4 grid grid-cols-3 gap-3 md:gap-5">
        <Cell k={`r${rel.base} since 20:00`} v={pc(r.baseRet)} />
        <Cell k={`so r${rel.leg} must be`} v={pc(r.required)} c="var(--color-mark)" />
        <Cell k={`r${rel.leg} actually is`} v={pc(r.legRet)} c={col} />
      </div>

      <div className="rule-t px-4 md:px-5 py-3.5 flex items-baseline gap-3 flex-wrap">
        <span className="cap">left over</span>
        <span className="num text-[22px] leading-none" style={{ color: col }}>
          {fmtBps(r.residualBps)}<span className="text-[12px] ml-1">bps</span>
        </span>
        {!compact && (
          <span className="text-[12.5px] text-[var(--color-ink-2)] ml-auto max-w-[420px]">
            {r.severity === "pass"
              ? "Inside the tolerance this pair normally keeps at night."
              : `One of these two quotes is wrong by ${Math.abs(r.residualBps).toFixed(0)} bps. The arithmetic does not say which.`}
          </span>
        )}
      </div>
    </div>
  );
}

const Cell = ({ k, v, c }: { k: string; v: string; c?: string }) => (
  <div>
    <div className="cap truncate">{k}</div>
    <div className="num text-[17px] md:text-[19px] mt-1" style={c ? { color: c } : undefined}>{v}</div>
  </div>
);
