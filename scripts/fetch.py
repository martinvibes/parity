"""Pull hourly candles for every ticker the parity relations touch."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parity.bitget import candle_history  # noqa: E402
from parity.universe import rsymbol, universe  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "data"
OUT.mkdir(exist_ok=True)

for t in universe():
    sym = rsymbol(t)
    rows = candle_history(sym, "1h", pages=70)
    (OUT / f"{t}.json").write_text(json.dumps(rows))
    span = ""
    if rows:
        import datetime as dt
        f = dt.datetime.utcfromtimestamp(int(rows[0][0]) / 1000).date()
        l = dt.datetime.utcfromtimestamp(int(rows[-1][0]) / 1000).date()
        span = f"{f} -> {l}"
    print(f"{t:6} {len(rows):6,} bars  {span}", flush=True)
