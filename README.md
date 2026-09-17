# Parity

**An audit of Bitget's overnight rToken quotes against the identities they are required to satisfy.**

Built for the [Bitget AI Base Camp Hackathon S2](https://bitget-ai.gitbook.io/bitgetai_hackathons2) — AI Trading Desk track, Execution Assistance.

**Live:** https://parity-audit.vercel.app

---

## The argument

SOXL is contractually built to deliver three times the return of SOXX. SOXS delivers minus three times the same index. Measured from a common anchor over a single session, that is not a forecast — it is arithmetic:

```
r_leg  =  beta * r_base
```

While a US venue is open, rToken orders route to NYSE and Nasdaq and arbitrage holds this together. Between **20:00 and 04:00 ET** nothing does: each leg is quoted independently by a market maker, and they stop agreeing.

A leveraged ETF that is not moving at its stated multiple is not a prediction that someone is wrong. It is a proof that someone is. The arithmetic does not say which one.

## What we measured

15,852 hourly observations across 179 nights in 2026, over 14 identities.

**24.8% of them sit more than 20 basis points outside the identity.** The widest single reading was 668 bps.

### The overnight book is new

Share of the 8 nightly bars actually quoted: **2023: 0.0%, 2024: 0.0%, 2025: 31.0%, 2026: 82.3%**. Bitget switched this on recently, and nobody has audited it.

### Per identity

| pair | required | nights | session p50 | dark p50 | >20 bps | p99 | worst |
|---|---|---|---|---|---|---|---|
| rSOXL/rSOXX | 3.0x | 179 | 10.5 | 19.4 | 48.8% | 242 | 481 |
| rSQQQ/rQQQ | -3.0x | 180 | 4.9 | 7.8 | 13.8% | 154 | 258 |
| rTQQQ/rQQQ | 3.0x | 183 | 3.4 | 4.9 | 8.2% | 172 | 314 |
| rSPXU/rSPY | -3.0x | 177 | 6.2 | 8.3 | 14.6% | 73 | 129 |
| rSOXS/rSOXX | -3.0x | 179 | 22.8 | 25.6 | 59.5% | 244 | 330 |
| rTNA/rIWM | 3.0x | 177 | 7.2 | 8.1 | 14.5% | 66 | 507 |
| rTZA/rIWM | -3.0x | 177 | 14.2 | 15.4 | 37.5% | 107 | 150 |
| rSQQQ/rTQQQ | -1.0x | 180 | 5.8 | 5.7 | 8.6% | 181 | 226 |
| rSMH/rSOXX | 1.0x | 180 | 13.5 | 12.2 | 30.4% | 108 | 179 |
| rTZA/rTNA | -1.0x | 177 | 16.0 | 14.2 | 34.9% | 125 | 482 |
| rSOXS/rSOXL | -1.0x | 184 | 23.6 | 19.9 | 49.8% | 454 | 668 |
| rUPRO/rSPY | 3.0x | 177 | 9.8 | 6.0 | 8.5% | 71 | 81 |
| rQLD/rQQQ | 2.0x | 177 | 7.5 | 4.1 | 7.0% | 49 | 64 |
| rSPXU/rUPRO | -1.0x | 177 | 11.2 | 6.1 | 12.4% | 99 | 157 |

Session is the same arithmetic measured between 10:00 and 16:00 ET. Treat it as a floor on measurement noise rather than a clean control: hourly closes on two instruments in a fast market are not simultaneous, and that manufactures residual of its own. For a few pairs the session therefore reads *wider* than the night. The headline is the absolute breach rate, which does not depend on the control being clean.

### These are not stale prints

The obvious objection is that a wide reading is just an hour where one leg did not trade. It is not: median turnover inside the wide bars is equal to or higher than inside the quiet ones. Real quotes, real volume, genuinely inconsistent.

## The trade we did not find

If a breach closed by morning it would be an arbitrage. We entered every reading past 40 bps and held to the 04:00 open. Capture is what the breach gave back; cost is two sides of taker fee on gross notional — four dollars working per dollar of signal on a 3x pair, two on a mirror pair.

| pair | capture to the open | n | costs | net |
|---|---|---|---|---|
| rSOXL/rSOXX | +16.4 | 204 | -80 | -63.6 |
| rSQQQ/rQQQ | -3.3 | 21 | -80 | -83.3 |
| rTQQQ/rQQQ | +9.3 | 32 | -80 | -70.7 |
| rSPXU/rSPY | +0.7 | 42 | -80 | -79.3 |
| rSOXS/rSOXX | +32.7 | 306 | -80 | -47.3 |
| rTNA/rIWM | +8.7 | 16 | -80 | -71.3 |
| rTZA/rIWM | +23.6 | 104 | -80 | -56.4 |
| rSQQQ/rTQQQ | -2.1 | 21 | -40 | -42.1 |
| rSMH/rSOXX | +8.9 | 83 | -40 | -31.1 |
| rTZA/rTNA | +30.0 | 87 | -40 | -10.0 |
| rSOXS/rSOXL | +29.5 | 267 | -40 | -10.5 |
| rUPRO/rSPY | +3.8 | 24 | -80 | -76.2 |
| rQLD/rQQQ | -1.2 | 41 | -60 | -61.2 |
| rSPXU/rUPRO | -19.7 | 16 | -40 | -59.7 |

**Every net column is negative.** The breach is real, it is measurable, and it is not a trade.

That is the finding, not a failure to find one. These are defects you *pay*, not opportunities you take — which is why Parity is a pre-trade check rather than a strategy.

## What it is for

Before you put an order into an rToken at two in the morning, Parity tells you whether the venue's own arithmetic agrees with the price you are about to take, and — from 179 measured nights — whether that gap will still be there when you try to get out.

## Reproducing it

No API key, no account, no signing. Everything is Bitget's public spot endpoints.

```bash
python3 scripts/fetch.py    # hourly candles for the 14 tickers the identities touch
python3 scripts/audit.py    # grades them, writes public/audit.json
pnpm install && pnpm build  # the board re-implements the same residual in the browser
```

`public/audit.json` is the only source for every number on the site.

## Limits

- The arithmetic proves one of the two quotes is wrong. It never says which.
- Hourly bars, not ticks. A breach that opens and closes inside an hour is invisible.
- A bar with no trade is absent rather than carried forward, so a frozen quote is dropped rather than scored.
- Fund expenses, borrow and the daily reset move the identity by a few bps a day — noise against a 20 bps tolerance.
- This measures quote consistency. It is not advice, and it is not a claim that either price is correct.
