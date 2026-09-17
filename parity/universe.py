"""The parity relationships we check, and why each one must hold.

Every relationship here is an identity, not a forecast. A leveraged ETF is
contractually built to deliver a fixed multiple of its index's DAILY return, so
from the previous official close the relationship is arithmetic. Two ETFs over
the same basket must move together for the same reason. When Bitget's own
quotes break one of these, at least one of those quotes is wrong, and no model
is needed to say so.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Leg:
    symbol: str          # plain ticker, e.g. "TQQQ"
    beta: float          # required multiple of the base's return


@dataclass(frozen=True)
class Relation:
    name: str
    base: str            # the index leg, e.g. "QQQ"
    leg: Leg
    kind: str            # "leverage" | "wrapper"
    note: str

    @property
    def symbols(self) -> tuple[str, str]:
        return self.base, self.leg.symbol


# Leveraged pairs. Each issuer's prospectus fixes the multiple; it is not an estimate.
LEVERAGE = [
    ("QQQ", "TQQQ", 3.0, "ProShares UltraPro QQQ"),
    ("QQQ", "SQQQ", -3.0, "ProShares UltraPro Short QQQ"),
    ("QQQ", "QLD", 2.0, "ProShares Ultra QQQ"),
    ("SPY", "UPRO", 3.0, "ProShares UltraPro S&P 500"),
    ("SPY", "SPXU", -3.0, "ProShares UltraPro Short S&P 500"),
    ("IWM", "TNA", 3.0, "Direxion Small Cap Bull 3X"),
    ("IWM", "TZA", -3.0, "Direxion Small Cap Bear 3X"),
    ("SOXX", "SOXL", 3.0, "Direxion Semiconductor Bull 3X"),
    ("SOXX", "SOXS", -3.0, "Direxion Semiconductor Bear 3X"),
]

# Bull against bear on the SAME index. Both are 3x products off one benchmark, so
# r_bull == -r_bear. This is the cheapest expression of the identity: the legs are
# equal notional, where hedging a 3x product against its index costs four dollars of
# turnover for every one dollar of signal. Both legs are also the sloppily quoted end
# of the book, which is where the error lives.
MIRRORS = [
    ("TQQQ", "SQQQ", -1.0, "UltraPro QQQ against UltraPro Short QQQ"),
    ("UPRO", "SPXU", -1.0, "UltraPro S&P against UltraPro Short S&P"),
    ("TNA", "TZA", -1.0, "Small Cap Bull 3X against Bear 3X"),
    ("SOXL", "SOXS", -1.0, "Semiconductor Bull 3X against Bear 3X"),
]

# Two wrappers over near-identical baskets. The multiple is 1 by construction;
# the residual is basket drift plus quote error, so we hold it to a wider bar.
WRAPPERS = [
    ("SOXX", "SMH", 1.0, "iShares vs VanEck semiconductors"),
]


def relations() -> list[Relation]:
    out = []
    for base, sym, beta, note in LEVERAGE:
        out.append(Relation(f"{sym}/{base}", base, Leg(sym, beta), "leverage", note))
    for base, sym, beta, note in MIRRORS:
        out.append(Relation(f"{sym}/{base}", base, Leg(sym, beta), "mirror", note))
    for base, sym, beta, note in WRAPPERS:
        out.append(Relation(f"{sym}/{base}", base, Leg(sym, beta), "wrapper", note))
    return out


def universe() -> list[str]:
    """Every plain ticker the relationships touch."""
    seen: list[str] = []
    for r in relations():
        for s in r.symbols:
            if s not in seen:
                seen.append(s)
    return seen


def rsymbol(ticker: str) -> str:
    """Bitget spot symbol for an rToken. Symbols are uppercase: rTQQQ -> RTQQQUSDT."""
    return f"R{ticker}USDT"
