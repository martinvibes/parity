"""Grade Bitget's overnight book against the identities it must satisfy.

Writes public/audit.json — every figure the site shows comes from here, and
every one of them is computed from Bitget's own candles.
"""
from __future__ import annotations
import json, statistics as st, sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parity.core import DATA, anchor_ts, dark_bars, days_covered, load, residual_bps, session_bars
from parity.universe import relations

ROOT = Path(__file__).resolve().parents[1]
FEE_BPS = 10.0           # Bitget spot taker, per side, on gross notional
STUDY_FROM = 2026        # the dark book is only meaningfully quoted from here

def pct(xs, q):
    s = sorted(xs)
    return s[min(len(s) - 1, int(len(s) * q))] if s else 0.0

closes = {t: load(t) for t in {s for r in relations() for s in r.symbols}}
vols: dict[str, dict[int, float]] = {}
for t in closes:
    p = DATA / f"{t}.json"
    if p.exists():
        vols[t] = {int(r[0]): float(r[7]) for r in json.loads(p.read_text())}

# ── when did the dark window start being quoted at all ──────────────────────
coverage = defaultdict(lambda: {"got": 0, "want": 0})
for t, c in closes.items():
    for d in days_covered(c):
        for ts in dark_bars(d):
            coverage[d.year]["want"] += 1
            coverage[d.year]["got"] += ts in c
cov = {str(y): round(v["got"] / v["want"] * 100, 1) for y, v in sorted(coverage.items()) if v["want"] > 500}

out_rel = []
for rel in relations():
    base, leg = closes.get(rel.base, {}), closes.get(rel.leg.symbol, {})
    lv = vols.get(rel.leg.symbol, {})
    if not base or not leg:
        continue
    beta = rel.leg.beta
    gross = 1.0 + abs(beta)

    dark, sess, by_hour = [], [], defaultdict(list)
    vol_bucket = defaultdict(list)
    hold = defaultdict(list)
    n_days = 0

    for d in sorted(set(days_covered(base)) & set(days_covered(leg))):
        if d.year < STUDY_FROM:
            continue
        a = anchor_ts(d)
        if a not in base or a not in leg:
            continue
        ba, la = base[a], leg[a]
        bars = dark_bars(d)
        n_days += 1

        for i, ts in enumerate(bars):
            if ts not in base or ts not in leg:
                continue
            e = residual_bps(base[ts], ba, leg[ts], la, beta)
            dark.append(abs(e))
            by_hour[i].append(abs(e))
            if ts in lv:
                k = "quiet" if abs(e) < 20 else "wide" if abs(e) >= 60 else "middling"
                vol_bucket[k].append(lv[ts])
            # Does a wide reading go away if you wait?
            if abs(e) >= 40:
                for h in (1, 2, 3, 8):
                    j = min(i + h, len(bars) - 1)
                    if j == i or bars[j] not in base or bars[j] not in leg:
                        continue
                    e2 = residual_bps(base[bars[j]], ba, leg[bars[j]], la, beta)
                    hold[h].append((1 if e > 0 else -1) * (e - e2))

        sb = session_bars(d)
        if sb and sb[0] in base and sb[0] in leg:
            b0, l0 = base[sb[0]], leg[sb[0]]
            for ts in sb[1:]:
                if ts in base and ts in leg:
                    sess.append(abs(residual_bps(base[ts], b0, leg[ts], l0, beta)))

    if len(dark) < 100 or not sess:
        continue

    s50, d50 = st.median(sess), st.median(dark)
    out_rel.append({
        "name": rel.name, "base": rel.base, "leg": rel.leg.symbol, "beta": beta,
        "kind": rel.kind, "note": rel.note,
        "n_days": n_days, "n_dark": len(dark), "n_session": len(sess),
        "session_p50": round(s50, 2),
        "dark_p50": round(d50, 2), "dark_p90": round(pct(dark, 0.9), 1),
        "dark_p99": round(pct(dark, 0.99), 1), "dark_max": round(max(dark), 1),
        "ratio": round(d50 / max(s50, 0.01), 2),
        "breach_20": round(sum(x >= 20 for x in dark) / len(dark) * 100, 1),
        "breach_60": round(sum(x >= 60 for x in dark) / len(dark) * 100, 1),
        "by_hour": [round(st.median(by_hour[i]), 1) if by_hour.get(i) else None for i in range(8)],
        "volume": {k: round(st.median(v)) for k, v in vol_bucket.items() if v},
        # The backtest: enter on a 40bps reading, wait, book the change.
        "persistence": {str(h): {"mean_bps": round(st.mean(v), 1), "n": len(v)}
                        for h, v in sorted(hold.items()) if len(v) >= 10},
        "gross_multiple": gross,
        "cost_round_trip_bps": round(2 * FEE_BPS * gross, 1),
    })

out_rel.sort(key=lambda r: -r["ratio"])

# Headline: how much of the night sits outside a 20 bps tolerance, across everything.
all_dark = sum(r["n_dark"] for r in out_rel)
w_breach = sum(r["breach_20"] * r["n_dark"] for r in out_rel) / max(all_dark, 1)
pers = [r["persistence"].get("8", {}).get("mean_bps") for r in out_rel if r["persistence"].get("8")]

audit = {
    "generated_utc": __import__("datetime").datetime.now(__import__("datetime").UTC).isoformat(timespec="seconds"),
    "study_from": STUDY_FROM,
    "fee_bps_per_side": FEE_BPS,
    "coverage_by_year": cov,
    "headline": {
        "relations": len(out_rel),
        "observations": all_dark,
        "share_outside_20bps": round(w_breach, 1),
        "median_persistence_bps": round(st.median(pers), 1) if pers else None,
        "widest": max((r["dark_max"] for r in out_rel), default=0),
    },
    "relations": out_rel,
}
(ROOT / "public" / "audit.json").write_text(json.dumps(audit, indent=1))

print(f"coverage by year: {cov}")
print(f"\n{'relation':12} {'kind':9} {'nights':>6} {'sess':>6} {'dark':>6} {'ratio':>6} {'>20bps':>7} {'p99':>7} {'+8h':>7} {'cost':>6}")
print("-" * 82)
for r in out_rel:
    p8 = r["persistence"].get("8", {}).get("mean_bps")
    print(f"{r['name']:12} {r['kind']:9} {r['n_days']:6} {r['session_p50']:6.1f} {r['dark_p50']:6.1f} "
          f"{r['ratio']:5.1f}x {r['breach_20']:6.1f}% {r['dark_p99']:7.1f} "
          f"{(f'{p8:+.1f}' if p8 is not None else '—'):>7} {r['cost_round_trip_bps']:6.0f}")
print(f"\nheadline: {json.dumps(audit['headline'])}")
