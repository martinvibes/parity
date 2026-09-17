"""Does the effect exist? US-session residuals vs dark-window residuals."""
from __future__ import annotations
import statistics as st
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parity.core import anchor_ts, dark_bars, days_covered, et, load, residual_bps, session_bars
from parity.universe import relations

series = {}
for r in relations():
    for s in r.symbols:
        if s not in series:
            series[s] = load(s)

print(f"{'relation':12} {'kind':9} {'n_dark':>7} {'US |e| p50':>11} {'dark |e| p50':>13} {'dark p90':>9} {'ratio':>6}")
print("-" * 76)

for rel in relations():
    base, leg = series.get(rel.base, {}), series.get(rel.leg.symbol, {})
    if not base or not leg:
        print(f"{rel.name:12} {rel.kind:9}   missing data")
        continue

    days = [d for d in days_covered(base) if d in set(days_covered(leg))]
    dark, sess = [], []
    for d in days:
        a = anchor_ts(d)
        if a not in base or a not in leg:
            continue
        ba, la = base[a], leg[a]
        for ts in dark_bars(d):
            if ts in base and ts in leg:
                dark.append(abs(residual_bps(base[ts], ba, leg[ts], la, rel.leg.beta)))
        # Control: same arithmetic, but anchored inside the session where arbitrage runs.
        sb = session_bars(d)
        if sb and sb[0] in base and sb[0] in leg:
            b0, l0 = base[sb[0]], leg[sb[0]]
            for ts in sb[1:]:
                if ts in base and ts in leg:
                    sess.append(abs(residual_bps(base[ts], b0, leg[ts], l0, rel.leg.beta)))

    if not dark or not sess:
        print(f"{rel.name:12} {rel.kind:9}   too few overlapping bars")
        continue
    s50, d50 = st.median(sess), st.median(dark)
    d90 = sorted(dark)[int(len(dark) * 0.9)]
    print(f"{rel.name:12} {rel.kind:9} {len(dark):7,} {s50:11.1f} {d50:13.1f} {d90:9.1f} {d50/max(s50,0.01):6.1f}x")
