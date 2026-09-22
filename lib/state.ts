import type { Audit } from "./parity";
import type { Reading } from "./parity";
import type { Window } from "./time";

/** The facts the analyst is allowed to reason from about the audit itself. */
export function deskState(audit: Audit | null, win: Window | null, readings: Reading[]): string {
  if (!audit) return "DESK STATE: still loading.";
  const h = audit.headline;

  const board = readings.map((r) =>
    `r${r.rel.leg} must move ${r.rel.beta}x r${r.rel.base}: ` +
    `r${r.rel.base} is ${(r.baseRet * 100).toFixed(2)}% off the 20:00 close, so r${r.rel.leg} must be ` +
    `${(r.required * 100).toFixed(2)}%, but it is ${(r.legRet * 100).toFixed(2)}% — ` +
    `residual ${r.residualBps.toFixed(1)} bps (${r.severity}). ` +
    `This pair's normal night is ±${r.rel.dark_p90.toFixed(0)} bps and it breaks 20 bps ` +
    `${r.rel.breach_20.toFixed(1)}% of the time; median capture holding to the open ` +
    `${r.rel.persistence["8"]?.mean_bps ?? "n/a"} bps against ${r.rel.cost_round_trip_bps} bps of cost.`
  ).join("\n");

  return `DESK STATE — generated ${audit.generated_utc}

WINDOW: ${win ? (win.active ? `dark, ${(win.elapsed * 100).toFixed(0)}% through the 20:00-04:00 ET window` : "a US venue is open, so the board below is the close of the last dark window") : "unknown"}

MEASURED RECORD (${audit.study_from}, ${audit.relations[0]?.n_days ?? 0} nights, ${h.observations} hourly observations over ${h.relations} identities)
${h.share_outside_20bps}% of observations sit more than 20 bps outside the identity. Widest single reading ${h.widest} bps.
Dark-window quote coverage by year: ${Object.entries(audit.coverage_by_year).map(([y, v]) => `${y} ${v}%`).join(", ")}.
Taker fee assumed ${audit.fee_bps_per_side} bps per side on gross notional.

TONIGHT'S BOARD
${board || "no live readings yet"}`;
}
