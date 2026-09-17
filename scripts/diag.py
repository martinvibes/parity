"""Three questions: when is the dark book real, does it revert at any horizon, and
are the wide residuals just stale prints?"""
from __future__ import annotations
import json, statistics as st, sys
from collections import defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parity.core import DATA, anchor_ts, dark_bars, days_covered, et, load, residual_bps
from parity.universe import relations

# 1. COVERAGE BY YEAR — when did the dark window start being quoted at all?
print("dark-hour bar coverage by year (share of the 8 nightly bars present)")
for t in ["QQQ", "TQQQ", "SQQQ", "SPY", "UPRO", "SPXU", "IWM", "TNA"]:
    c = load(t)
    if not c: continue
    got, want = defaultdict(int), defaultdict(int)
    for d in days_covered(c):
        for ts in dark_bars(d):
            want[d.year] += 1
            if ts in c: got[d.year] += 1
    line = "  ".join(f"{y}:{got[y]/want[y]*100:4.0f}%" for y in sorted(want) if want[y] > 100)
    print(f"  {t:6} {line}")

# 2. VOLUME — is a wide residual just a bar nobody traded in?
print("\nturnover in the bar, by residual size (median USDT volume of the leg's bar)")
vol = {}
for t in ["TQQQ", "SQQQ", "QQQ", "SPXU", "UPRO", "SPY", "TNA", "IWM"]:
    p = DATA / f"{t}.json"
    if p.exists():
        vol[t] = {int(r[0]): float(r[7]) for r in json.loads(p.read_text())}

series = {s: load(s) for r in relations() for s in r.symbols}
for rel in relations():
    base, leg = series.get(rel.base, {}), series.get(rel.leg.symbol, {})
    lv = vol.get(rel.leg.symbol)
    if not base or not leg or not lv: continue
    buckets = defaultdict(list)
    for d in sorted(set(days_covered(base)) & set(days_covered(leg))):
        a = anchor_ts(d)
        if a not in base or a not in leg: continue
        for ts in dark_bars(d):
            if ts in base and ts in leg and ts in lv:
                e = abs(residual_bps(base[ts], base[a], leg[ts], leg[a], rel.leg.beta))
                buckets["|e|<20" if e < 20 else "|e|>=60" if e >= 60 else "20-60"].append(lv[ts])
    cells = "  ".join(f"{k}: ${st.median(v)/1e3:7,.0f}k (n={len(v):4,})" for k, v in
                      sorted(buckets.items()) if v)
    print(f"  {rel.name:12} {cells}")

# 3. REVERSION AT ANY HORIZON — not just at the open.
print("\nmean signed capture (bps) entering on |e|>=40, by how long you hold")
for rel in relations():
    base, leg = series.get(rel.base, {}), series.get(rel.leg.symbol, {})
    if not base or not leg: continue
    beta = rel.leg.beta
    hold = defaultdict(list)
    for d in sorted(set(days_covered(base)) & set(days_covered(leg))):
        a = anchor_ts(d)
        if a not in base or a not in leg: continue
        ba, la = base[a], leg[a]
        bars = dark_bars(d)
        for i, ts in enumerate(bars):
            if ts not in base or ts not in leg: continue
            e = residual_bps(base[ts], ba, leg[ts], la, beta)
            if abs(e) < 40: continue
            for h in (1, 2, 3, 8):
                j = min(i + h, len(bars) - 1)
                t2 = bars[j]
                if t2 not in base or t2 not in leg or j == i: continue
                e2 = residual_bps(base[t2], ba, leg[t2], la, beta)
                hold[h].append((1 if e > 0 else -1) * (e - e2))
    if not hold: continue
    cells = "  ".join(f"+{h}h: {st.mean(v):+6.1f} (n={len(v):3,})" for h, v in sorted(hold.items()) if len(v) >= 10)
    if cells: print(f"  {rel.name:12} {cells}")
