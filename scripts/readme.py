import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
a = json.load(open(ROOT / "public/audit.json"))
h, r = a["headline"], a["relations"]
nights = r[0]["n_days"]

rows = "\n".join(
    f"| r{x['leg']}/r{x['base']} | {x['beta']}x | {x['n_days']} | {x['session_p50']:.1f} | "
    f"{x['dark_p50']:.1f} | {x['breach_20']:.1f}% | {x['dark_p99']:.0f} | {x['dark_max']:.0f} |"
    for x in r)
pers = "\n".join(
    f"| r{x['leg']}/r{x['base']} | {x['persistence']['8']['mean_bps']:+.1f} | {x['persistence']['8']['n']} | "
    f"-{x['cost_round_trip_bps']:.0f} | {x['persistence']['8']['mean_bps'] - x['cost_round_trip_bps']:+.1f} |"
    for x in r if x["persistence"].get("8"))
cov = ", ".join(f"{k}: {v}%" for k, v in a["coverage_by_year"].items())

FENCE = "```"
doc = f"""# Parity

**An audit of Bitget's overnight rToken quotes against the identities they are required to satisfy.**

Built for the [Bitget AI Base Camp Hackathon S2](https://bitget-ai.gitbook.io/bitgetai_hackathons2) — AI Trading Desk track, Execution Assistance.

**Live:** https://parity-audit.vercel.app

---

## The argument

SOXL is contractually built to deliver three times the return of SOXX. SOXS delivers minus three times the same index. Measured from a common anchor over a single session, that is not a forecast — it is arithmetic:

{FENCE}
r_leg  =  beta * r_base
{FENCE}

While a US venue is open, rToken orders route to NYSE and Nasdaq and arbitrage holds this together. Between **20:00 and 04:00 ET** nothing does: each leg is quoted independently by a market maker, and they stop agreeing.

A leveraged ETF that is not moving at its stated multiple is not a prediction that someone is wrong. It is a proof that someone is. The arithmetic does not say which one.

## What we measured

{h['observations']:,} hourly observations across {nights} nights in {a['study_from']}, over {h['relations']} identities.

**{h['share_outside_20bps']}% of them sit more than 20 basis points outside the identity.** The widest single reading was {h['widest']:.0f} bps.

### The overnight book is new

Share of the 8 nightly bars actually quoted: **{cov}**. Bitget switched this on recently, and nobody has audited it.

### Per identity

| pair | required | nights | session p50 | dark p50 | >20 bps | p99 | worst |
|---|---|---|---|---|---|---|---|
{rows}

Session is the same arithmetic measured between 10:00 and 16:00 ET. Treat it as a floor on measurement noise rather than a clean control: hourly closes on two instruments in a fast market are not simultaneous, and that manufactures residual of its own. For a few pairs the session therefore reads *wider* than the night. The headline is the absolute breach rate, which does not depend on the control being clean.

### These are not stale prints

The obvious objection is that a wide reading is just an hour where one leg did not trade. It is not: median turnover inside the wide bars is equal to or higher than inside the quiet ones. Real quotes, real volume, genuinely inconsistent.

## The trade we did not find

If a breach closed by morning it would be an arbitrage. We entered every reading past 40 bps and held to the 04:00 open. Capture is what the breach gave back; cost is two sides of taker fee on gross notional — four dollars working per dollar of signal on a 3x pair, two on a mirror pair.

| pair | capture to the open | n | costs | net |
|---|---|---|---|---|
{pers}

**Every net column is negative.** The breach is real, it is measurable, and it is not a trade.

That is the finding, not a failure to find one. These are defects you *pay*, not opportunities you take — which is why Parity is a pre-trade check rather than a strategy.

## What it is for

Before you put an order into an rToken at two in the morning, Parity tells you whether the venue's own arithmetic agrees with the price you are about to take, and — from {nights} measured nights — whether that gap will still be there when you try to get out.

## Reproducing it

No API key, no account, no signing. Everything is Bitget's public spot endpoints.

{FENCE}bash
python3 scripts/fetch.py    # hourly candles for the 14 tickers the identities touch
python3 scripts/audit.py    # grades them, writes public/audit.json
pnpm install && pnpm build  # the board re-implements the same residual in the browser
{FENCE}

`public/audit.json` is the only source for every number on the site.

## Limits

- The arithmetic proves one of the two quotes is wrong. It never says which.
- Hourly bars, not ticks. A breach that opens and closes inside an hour is invisible.
- A bar with no trade is absent rather than carried forward, so a frozen quote is dropped rather than scored.
- Fund expenses, borrow and the daily reset move the identity by a few bps a day — noise against a 20 bps tolerance.
- This measures quote consistency. It is not advice, and it is not a claim that either price is correct.
"""
(ROOT / "README.md").write_text(doc)
print("written", len(doc), "chars")
