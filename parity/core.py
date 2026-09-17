"""Parity residuals: how far Bitget's own quotes are from the identity they must satisfy.

A leveraged ETF delivers a fixed multiple of its index's return. Measured from a
common anchor over a single session, that relationship is arithmetic:

    r_leg  ==  beta * r_base

The residual is what is left over, in basis points:

    e  =  (r_leg - beta * r_base) * 1e4

While a US venue is open, arbitrage holds e near zero. Between 20:00 and 04:00 ET
nothing holds it anywhere, because each leg is quoted independently by a market
maker. A non-zero e in the dark is not a forecast that someone is wrong. It is a
proof that someone is, because both quotes cannot be right at once.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")
DATA = Path(__file__).resolve().parents[1] / "data"

# The US session on Bitget's rTokens runs 04:00-20:00 ET. Outside it there is no
# venue behind the quote.
SESSION_OPEN_HOUR = 4
SESSION_LAST_HOUR = 19


def load(ticker: str) -> dict[int, float]:
    """ts_ms -> close. Bars with no trade are simply absent."""
    path = DATA / f"{ticker}.json"
    if not path.exists():
        return {}
    rows = json.loads(path.read_text())
    return {int(r[0]): float(r[4]) for r in rows if float(r[4]) > 0}


def et(ts_ms: int) -> datetime:
    return datetime.fromtimestamp(ts_ms / 1000, ET)


def anchor_ts(day: datetime) -> int:
    """The 19:00 ET bar on `day` — its close is the 20:00 ET session close."""
    a = day.replace(hour=SESSION_LAST_HOUR, minute=0, second=0, microsecond=0)
    return int(a.timestamp() * 1000)


def dark_bars(day: datetime) -> list[int]:
    """Hourly bar timestamps inside the 20:00 -> 04:00 ET window opened on `day`."""
    start = day.replace(hour=20, minute=0, second=0, microsecond=0)
    return [int((start + timedelta(hours=h)).timestamp() * 1000) for h in range(8)]


def session_bars(day: datetime) -> list[int]:
    """Bars in the liquid middle of the US session — the control group."""
    return [
        int(day.replace(hour=h, minute=0, second=0, microsecond=0).timestamp() * 1000)
        for h in range(10, 16)
    ]


def residual_bps(base_now: float, base_anchor: float, leg_now: float, leg_anchor: float, beta: float) -> float:
    r_base = base_now / base_anchor - 1.0
    r_leg = leg_now / leg_anchor - 1.0
    return (r_leg - beta * r_base) * 1e4


def days_covered(closes: dict[int, float]) -> list[datetime]:
    """Distinct ET calendar days present in a series, oldest first."""
    seen = {et(ts).date() for ts in closes}
    return sorted(datetime(d.year, d.month, d.day, tzinfo=ET) for d in seen)
