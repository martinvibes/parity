import type { Candle } from "./bitget";
import { etHour } from "./time";

/** One identity the venue's own quotes are required to satisfy. */
export type Relation = {
  name: string; base: string; leg: string; beta: number;
  kind: "leverage" | "mirror" | "wrapper"; note: string;
  n_days: number; n_dark: number; n_session: number;
  session_p50: number; dark_p50: number; dark_p90: number; dark_p99: number; dark_max: number;
  ratio: number; breach_20: number; breach_60: number;
  by_hour: (number | null)[];
  volume: Record<string, number>;
  persistence: Record<string, { mean_bps: number; n: number }>;
  gross_multiple: number; cost_round_trip_bps: number;
};

export type Audit = {
  generated_utc: string;
  study_from: number;
  fee_bps_per_side: number;
  coverage_by_year: Record<string, number>;
  headline: {
    relations: number; observations: number; share_outside_20bps: number;
    median_persistence_bps: number | null; widest: number;
  };
  relations: Relation[];
};

export const rsymbol = (t: string) => `R${t}USDT`;

/** Close of the 19:00 ET bar at or before the window start = the 20:00 ET session close. */
export function anchorClose(cs: Candle[], start: Date): number | null {
  let a: number | null = null;
  for (const c of cs) {
    const d = new Date(c.t);
    if (d <= start && etHour(d) === 19) a = c.c;
  }
  return a;
}

export type Reading = {
  rel: Relation;
  basePx: number; legPx: number;
  baseAnchor: number; legAnchor: number;
  baseRet: number; legRet: number;
  required: number;        // what the leg's return must be
  residualBps: number;     // what is left over — the violation
  severity: "pass" | "watch" | "fail";
  /** What this breach costs to trade into, per $1 of leg notional, in bps. */
  costBps: number;
};

/**
 * A reading is not a prediction. The leg is contractually built to deliver
 * `beta` times the base's return from a common anchor; anything left over means
 * one of the two quotes is wrong, and the arithmetic says so without a model.
 */
export function read(rel: Relation, px: Record<string, number>, anchors: Record<string, number>): Reading | null {
  const bp = px[rel.base], lp = px[rel.leg];
  const ba = anchors[rel.base], la = anchors[rel.leg];
  if (!bp || !lp || !ba || !la) return null;

  const baseRet = bp / ba - 1;
  const legRet = lp / la - 1;
  const required = rel.beta * baseRet;
  const residualBps = (legRet - required) * 1e4;
  const a = Math.abs(residualBps);

  // Graded against this relation's own measured night, not a universal number.
  const severity = a >= Math.max(60, rel.dark_p90 * 2) ? "fail" : a >= Math.max(20, rel.dark_p90) ? "watch" : "pass";
  return { rel, basePx: bp, legPx: lp, baseAnchor: ba, legAnchor: la, baseRet, legRet, required, residualBps, severity, costBps: a };
}

export const fmtBps = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;
