"""What does a breach actually pay?

Entering when the residual is wide only makes money if it narrows by the open.
This measures that directly: enter at hour h when |e| clears a threshold, unwind
at the 04:00 ET reopen, and book sign(e_h) * (e_h - e_open).

Costs are charged on GROSS notional. Holding $1 of the leg against $|beta| of the
base means $(1+|beta|) working per $1 of signal, twice — in and out. A mirror pair
is therefore four times cheaper to express than a 3x-against-index pair.
"""
from __future__ import annotations
import statistics as st, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parity.core import anchor_ts, dark_bars, days_covered, load, residual_bps
from parity.universe import relations

FEES_BPS = [10.0, 6.0, 2.0]   # taker, maker, VIP maker — per side, per gross dollar

series: dict[str, dict[int, float]] = {}
for r in relations():
    for s in r.symbols:
        series.setdefault(s, load(s))

print(f"{'relation':12} {'kind':9} {'obs':>6} {'|e| p50':>8} {'p90':>7} {'p99':>7} {'max':>7}")
print("-" * 62)
trades: dict[str, list[tuple[float, float, float]]] = {}   # rel -> (e_h, pnl_bps, gross)

for rel in relations():
    base, leg = series.get(rel.base, {}), series.get(rel.leg.symbol, {})
    if not base or not leg:
        continue
    beta = rel.leg.beta
    gross = 1.0 + abs(beta)
    es, rows = [], []
    common = set(days_covered(base)) & set(days_covered(leg))
    for d in sorted(common):
        a = anchor_ts(d)
        if a not in base or a not in leg:
            continue
        ba, la = base[a], leg[a]
        bars = dark_bars(d)
        open_ts = bars[-1]                       # the 03:00 bar closes at 04:00 ET
        if open_ts not in base or open_ts not in leg:
            continue
        e_open = residual_bps(base[open_ts], ba, leg[open_ts], la, beta)
        for ts in bars[:-1]:
            if ts not in base or ts not in leg:
                continue
            e = residual_bps(base[ts], ba, leg[ts], la, beta)
            es.append(abs(e))
            pnl = (1 if e > 0 else -1) * (e - e_open)
            rows.append((abs(e), pnl, gross))
    if not es:
        continue
    q = sorted(es)
    trades[rel.name] = rows
    print(f"{rel.name:12} {rel.kind:9} {len(es):6,} {st.median(es):8.1f} "
          f"{q[int(len(q)*.9)]:7.1f} {q[int(len(q)*.99)]:7.1f} {max(es):7.1f}")

print()
print("NET OF COSTS — enter when |e| clears the threshold, unwind at the open")
print(f"{'relation':12} {'thr':>5} {'n':>5} {'gross bps':>10} " + " ".join(f"{'net@'+str(int(f)):>9}" for f in FEES_BPS))
print("-" * 70)
for name, rows in trades.items():
    gross_mult = rows[0][2]
    for thr in (30, 60, 100):
        take = [(e, p) for e, p, _ in rows if e >= thr]
        if len(take) < 20:
            continue
        avg = st.mean(p for _, p in take)
        cells = []
        for f in FEES_BPS:
            cost = 2 * f * gross_mult          # in and out, on gross notional
            cells.append(f"{avg - cost:9.1f}")
        print(f"{name:12} {thr:5} {len(take):5,} {avg:10.1f} " + " ".join(cells))
