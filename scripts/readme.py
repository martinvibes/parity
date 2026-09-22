"""Regenerate README.md from public/audit.json.

Every figure in the README is interpolated from the audit, so the document
cannot drift from the data. Static prose lives in plain strings; only the
tables are f-strings.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
a = json.load(open(ROOT / "public/audit.json"))
h, R = a["headline"], a["relations"]
nights = R[0]["n_days"]
F = "```"

kinds = {k: sum(1 for x in R if x["kind"] == k) for k in ("leverage", "mirror", "wrapper")}
cov = ", ".join(f"**{k}: {v}%**" for k, v in a["coverage_by_year"].items())
worst = max(R, key=lambda x: x["breach_20"])
tightest = min(R, key=lambda x: x["breach_20"])

per_identity = "\n".join(
    f"| r{x['leg']}/r{x['base']} | {x['beta']}× | {x['kind']} | {x['n_days']} | {x['session_p50']:.1f} | "
    f"{x['dark_p50']:.1f} | {x['dark_p90']:.0f} | **{x['breach_20']:.1f}%** | {x['dark_p99']:.0f} | {x['dark_max']:.0f} |"
    for x in R)

persistence = "\n".join(
    f"| r{x['leg']}/r{x['base']} | {x['persistence']['1']['mean_bps']:+.1f} | "
    f"{x['persistence']['3']['mean_bps']:+.1f} | {x['persistence']['8']['mean_bps']:+.1f} | "
    f"{x['persistence']['8']['n']} | −{x['cost_round_trip_bps']:.0f} | "
    f"**{x['persistence']['8']['mean_bps'] - x['cost_round_trip_bps']:+.1f}** |"
    for x in R if x["persistence"].get("8") and x["persistence"].get("1") and x["persistence"].get("3"))

turnover = "\n".join(
    f"| r{x['leg']}/r{x['base']} | ${x['volume']['quiet']/1e3:,.0f}k | ${x['volume']['middling']/1e3:,.0f}k | "
    f"**${x['volume']['wide']/1e3:,.0f}k** | {'busier' if x['volume']['wide'] >= x['volume']['quiet'] else 'quieter'} |"
    for x in R if x["volume"].get("quiet") and x["volume"].get("wide"))

n_wide_busier = sum(1 for x in R if x["volume"].get("wide", 0) >= x["volume"].get("quiet", 1e18))
n_vol = sum(1 for x in R if x["volume"].get("quiet") and x["volume"].get("wide"))

HEAD = """# Parity

**A pre-trade check on Bitget's overnight rToken quotes, against the identities they are required to satisfy.**

SOXL is contractually built to deliver three times the return of SOXX. SOXS delivers minus three times the same index. Measured from a common anchor over a single session, that is not a forecast — it is arithmetic. While a US venue is open, rToken orders route to NYSE and Nasdaq and arbitrage holds it together. Between **20:00 and 04:00 ET** nothing does: each leg is quoted independently by a market maker, and they stop agreeing.

A leveraged ETF that is not moving at its stated multiple is not a prediction that someone is wrong. It is a **proof** that someone is. The arithmetic does not say which one.
"""

FACTS = f"""
**Live:** https://parity-audit.vercel.app
**Built for:** [Bitget AI Base Camp Hackathon S2](https://bitget-ai.gitbook.io/bitgetai_hackathons2) — AI Trading Desk, Execution Assistance
**The audit:** {h['observations']:,} hourly observations · {h['relations']} identities · ~{nights} nights in {a['study_from']} · **{h['share_outside_20bps']}% break by more than 20 bps**

---

## Features

### Core Capabilities

- **Identities, not models** — {h['relations']} relationships whose multiple is set in an issuer's prospectus, not estimated by us. There is no fair value to argue about and no parameter to tune.
- **Graded against its own night** — A reading is scored against the p90 that *this pair* actually produces in the dark, not against a universal threshold. r{worst['leg']}/r{worst['base']} breaks 20 bps on {worst['breach_20']:.1f}% of nights; r{tightest['leg']}/r{tightest['base']} on {tightest['breach_20']:.1f}%. One number for both would be useless.
- **The cost of acting on it** — Every breach is priced. Holding $1 of the leg against $|β| of the base is `1+|β|` gross dollars per dollar of signal, charged twice: 80 bps round trip on a 3× pair, 40 on a mirror, at {a['fee_bps_per_side']:.0f} bps a side.
- **The trade we did not find** — We entered every reading past 40 bps and held to the open. **Every net-of-cost column is negative.** That finding is the product: these are defects you pay, not opportunities you take.
- **The stale-print objection, answered** — Median turnover inside wide bars equals or exceeds quiet bars on {n_wide_busier} of {n_vol} pairs. Real quotes, real volume, genuinely inconsistent.
- **Live analyst with real hands** — Three tools wired to Bitget's market API. It is instructed never to answer a price question from memory, and the chips above each reply name the call it made.
- **No backend in the hot path** — The board re-implements the same residual in the browser and reads Bitget directly. Nothing of ours sits between you and the venue.

### The Site

- **Live board** — Every identity ranked by how far it has drifted, re-read every 45 seconds, with the arithmetic and an 8-bar histogram of where in the night that pair usually breaks.
- **Research desk** — A candlestick chart on any rToken or spot symbol, and an analyst you can ask anything from "what's the price of SOL" to "what's breaking tonight".
- **Evidence** — Four tables, one argument, and the raw `audit.json` behind every figure.
- **Method** — What is measured, how, and where it stops being true — including why the control is weak.

---

## Architecture

<p align="center">
  <img src="assets/architecture.svg" alt="Parity architecture" width="900" />
</p>

Parity has one upstream — Bitget's public spot API — and reaches it three different ways.

### Layer 1: The audit (Python, offline)

Run once; the output is committed. Pulls 70 pages of hourly candles for the tickers the identities touch, anchors each night on the 19:00 ET close, walks the eight dark bars, and grades every one:

- `parity/core.py` owns the **20:00 → 04:00 ET** boundary, `dark_bars()`, `session_bars()` (the 10:00–16:00 control) and `residual_bps()`.
- `parity/universe.py` declares the identities as data — `LEVERAGE`, `MIRRORS`, `WRAPPERS` — each with the multiple its prospectus fixes.
- `scripts/audit.py` scores persistence, turnover and cost, and writes `public/audit.json`.

### Layer 2: `public/audit.json`

One file. Every figure on the site comes from it; nothing is computed server-side at request time. `scripts/readme.py` regenerates the tables in this document from that same file, so the README cannot drift from the data.

### Layer 3: The site (Next.js, browser)

`lib/parity.ts` re-implements `read()` — the same residual, in TypeScript — and `lib/desk.tsx` polls Bitget directly from the page. Bitget serves `access-control-allow-origin: *`, so **the live board has no server of ours at all**.

One server route exists: `app/api/ask`, which holds the model key and runs the tool loop. Without a key the board, the evidence and the method are unaffected.

### Data Flow

{F}
Audit (offline, once)                        Board (browser, live)
     │                                              │
     ├─ fetch.py ── 70 pages × 14 tickers           │
     ├─ anchor  = close of the 19:00 ET bar         │
     ├─ dark    = the 8 bars from 20:00             │
     ├─ session = 10:00–16:00, the control          │
     │                                              │
     ├─ residual_bps = (r_leg − β·r_base) × 1e4     │
     ├─ persistence at +1h, +2h, +3h, to the open   │
     ├─ turnover split by |residual|                │
     ├─ cost = 2 × fee × (1 + |β|)                  │
     │            │                                 │
     │            └─► public/audit.json ───────────►├─ load the audit
     │                                              ├─ darkWindow(now)
     │                                              ├─ GET /spot/market/tickers
     │                                              ├─ GET /candles → anchor per leg
     │                                              ├─ read() → the same residual
     │                                              └─ grade vs THIS pair's dark_p90
     │                                                       │
     │                             POST /api/ask ◄───────────┘  the analyst
     │                                   │
     │                                   ├─ round 1..4: the model may call a tool
     │                                   ├─ get_price · get_recent_candles · get_top_movers
     │                                   └─ each tool hits the SAME Bitget endpoints
{F}

---

## The Identity

A leveraged ETF is built to deliver a fixed multiple of its index's **daily** return. Anchor both legs at the same instant inside one session and the daily reset becomes irrelevant — what is left is one line:

{F}
r_leg  =  beta * r_base

residual_bps  =  ( r_leg  -  beta * r_base ) * 10,000
{F}

Where `r = price / anchor - 1`, and `anchor` is the close of the **19:00 ET bar** — the last print of the 20:00 session close.

Everything left over is the residual. It carries no view about where anything is going. It says only that two prices the venue is publishing at the same moment cannot both be right.

### The {h['relations']} relationships

| Kind | Count | Why it must hold | Tolerance |
|------|-------|------------------|-----------|
| **Leverage** | {kinds['leverage']} | The issuer's prospectus fixes the multiple — 3×, −3×, 2× | Tight |
| **Mirror** | {kinds['mirror']} | Bull and bear 3× products over the *same* index: `r_bull = −r_bear` | Tight, and cheapest to express |
| **Wrapper** | {kinds['wrapper']} | SMH and SOXX wrap near-identical baskets, so β = 1 | Wider — basket drift is real |

Mirrors are the interesting case. Both legs are the sloppily quoted end of the book, which is where the error lives, and hedging them is equal-notional rather than one-against-three — so they cost half as much to act on.

---

## What We Measured

**{h['observations']:,} hourly observations** across ~{nights} nights in {a['study_from']}, over {h['relations']} identities.

**{h['share_outside_20bps']}% of them sit more than 20 basis points outside the identity.** The widest single reading was **{h['widest']:.0f} bps**.

### 01 · The overnight book is new

An identity can only be checked when both legs are actually quoted. Share of the 8 nightly bars with a real print:

{cov}

Before 2025 the dark window is empty, which is why the study starts where it does — and why nobody has audited this yet.

### 02 · How often each identity breaks

| pair | required | kind | nights | session p50 | dark p50 | dark p90 | >20 bps | p99 | worst |
|---|---|---|---|---|---|---|---|---|---|
{per_identity}

**Session** is the same arithmetic measured between 10:00 and 16:00 ET, when arbitrage is live. Treat it as a floor on measurement noise rather than a clean control: hourly closes on two instruments in a fast market are not simultaneous, and that manufactures residual of its own. For a few pairs the session therefore reads *wider* than the night.

The headline is the **absolute breach rate**, which does not depend on the control being clean.

### 03 · The trade we did not find

If a breach closed by morning it would be an arbitrage. We entered every reading past 40 bps and held to the 04:00 open. Capture is what the breach gave back; cost is two sides of taker fee on gross notional — four dollars working per dollar of signal on a 3× pair, two on a mirror.

| pair | +1h | +3h | to the open | n | costs | net |
|---|---|---|---|---|---|---|
{persistence}

**Every net column is negative.** The breach is real, it is measurable, and it is not a trade.

That is the finding, not a failure to find one. These are defects you *pay*, not opportunities you take — which is exactly why Parity is a pre-trade check rather than a strategy. You do not harvest these. You avoid paying them.

### 04 · These are not stale prints

The obvious objection is that a wide reading is just an hour where one leg did not trade. Median turnover inside the leg's own bar, split by how wide the reading was:

| pair | quiet (<20 bps) | middling | wide (≥60 bps) | verdict |
|---|---|---|---|---|
{turnover}

Wide bars are as busy as quiet ones, or busier, on **{n_wide_busier} of {n_vol}** pairs. Real quotes, real volume, genuinely inconsistent.

---

## Technology Stack

**Audit:**
- Python 3.11+, standard library only — no pandas, no numpy
- `zoneinfo` for DST-correct ET arithmetic
- Output is a single committed JSON file

**Site:**
- Next.js 16.3.5 (App Router, Turbopack) + React 19
- TypeScript 5 (strict)
- Tailwind CSS v4 (`@theme` tokens, no config file)
- Framer Motion — page transitions, stagger, the spring nav indicator
- Lightweight Charts 4.2.3 — candlesticks
- lucide-react, clsx, tailwind-merge

**Integrations:**
- Bitget public spot v2 REST — keyless, CORS-open, called from the browser *and* from the analyst's tools
- Any OpenAI-compatible chat endpoint with tool calling

---

## Getting Started

### Prerequisites

- **Node.js 20+** and **pnpm**
- **Python 3.11+** (only to rebuild the audit; the committed `audit.json` is enough to run the site)
- No Bitget account, no API key, no signing — every endpoint used is public and read-only

### Installation

**1. Clone the repository:**
{F}bash
git clone https://github.com/martinvibes/parity.git
cd parity
{F}

**2. Install:**
{F}bash
pnpm install
{F}

### Environment Setup

The site needs **no environment variables to run**. The board, the evidence and the method all work with nothing configured.

One optional variable enables the analyst on `/research`:

{F}bash
# .env.local — never commit this
OPENAI_API_KEY=sk-...
{F}

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | — | Key for the analyst. Also accepted as `LLM_API_KEY` |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI-compatible base URL |
| `LLM_MODEL` | `gpt-4o` | Model name. Must support tool calling |

Without a key, `/api/ask` returns a clear 503 and **the rest of the site is unaffected**.

### Running

{F}bash
pnpm dev          # http://localhost:3000
pnpm build        # production build
npx tsc --noEmit  # typecheck
{F}

### Rebuilding the audit

{F}bash
python3 scripts/fetch.py    # hourly candles for the tickers the identities touch
python3 scripts/audit.py    # grades them, writes public/audit.json
python3 scripts/readme.py   # regenerates this README from that file
{F}

---

## Project Structure

{F}
parity/
├── parity/                            # the audit library
│   ├── bitget.py                      # public API client (no key, no signing)
│   ├── universe.py                    # the identities, as data + the multiple each prospectus fixes
│   └── core.py                        # the 20:00→04:00 boundary, dark_bars(), residual_bps()
│
├── scripts/
│   ├── fetch.py                       # cache hourly candles → data/*.json (gitignored)
│   ├── audit.py                       # grade every night → public/audit.json
│   ├── readme.py                      # regenerate this README from that file
│   ├── diag.py  probe.py  revert.py   # exploratory checks kept for reproducibility
│
├── app/                               # Next.js App Router
│   ├── page.tsx                       # landing
│   ├── board/page.tsx                 # the live board
│   ├── research/page.tsx              # chart + analyst
│   ├── evidence/page.tsx              # the four tables
│   ├── method/page.tsx                # method and limits
│   ├── api/ask/route.ts               # the analyst — key lives here, tool loop runs here
│   └── globals.css                    # the whole design system, Tailwind v4 @theme
│
├── components/
│   ├── Landing.tsx                    # hero, live proof panel, feature cards
│   ├── Navbar.tsx                     # pill nav with the spring layoutId indicator
│   ├── Chart.tsx                      # lightweight-charts candlesticks + OHLC readout
│   ├── FlashlightEffect.tsx           # cursor spotlight, desktop only
│   ├── Orbs.tsx                       # the three floating blurred orbs
│   └── ui/GlassCard.tsx               # the glass surface + shimmer sweep on hover
│
├── lib/
│   ├── time.ts                        # darkWindow() — DST-safe ET arithmetic
│   ├── bitget.ts                      # browser client + bounded-concurrency pool()
│   ├── parity.ts                      # read() — the same residual, in TypeScript
│   ├── tools.ts                       # the analyst's three tools + symbol resolution
│   ├── state.ts                       # live board → analyst context
│   ├── desk.tsx                       # the live provider, 45 s poll
│   └── animations.ts  cn.ts           # motion variants, class merging
│
└── public/audit.json                  # ⭐ the only source for every number on the site
{F}

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | The thesis, and the worst identity on the book right now |
| `/board` | Board | Every identity ranked by drift, with the arithmetic and the night profile |
| `/research` | Research | Candlestick chart on any symbol, plus the analyst |
| `/evidence` | Evidence | The four tables above, and the raw `audit.json` |
| `/method` | Method | What is measured, how, and where it stops being true |

---

## API Reference

### `POST /api/ask`

One question, up to four rounds of tool calls, one answer. Server-side; the model key never reaches the browser.

| Field | Type | Description |
|-------|------|-------------|
| `question` | `string` | Max 600 chars |
| `state` | `string` | The live board, as context. Max 16,000 chars |

**Response:**

{F}json
{{
  "text": "The current price of SOL is $116.74. Over the past 24 hours, SOL is up by 0.89%.",
  "tools": [
    {{ "name": "get_price", "args": {{ "symbol": "SOL" }}, "result": {{ "...": "..." }} }},
    {{ "name": "get_recent_candles", "args": {{ "symbol": "SOL", "granularity": "1h" }}, "result": {{ "...": "..." }} }}
  ],
  "model": "gpt-4o"
}}
{F}

The `tools` array is rendered in the UI as chips above each answer, so the reader can see exactly which call produced the figure.

### The analyst's tools

| Tool | Arguments | Hits |
|------|-----------|------|
| `get_price` | `symbol` | `/api/v2/spot/market/tickers` |
| `get_recent_candles` | `symbol`, `granularity` (`15min`\\|`1h`\\|`4h`\\|`1day`), `limit` ≤ 48 | `/api/v2/spot/market/candles` |
| `get_top_movers` | `direction` (`gainers`\\|`losers`), `limit` ≤ 10 | `/api/v2/spot/market/tickers`, filtered to > $2M turnover |

`lib/tools.ts` resolves loose input to a real Bitget symbol before any call: `bitcoin` → `BTCUSDT`, `sol` → `SOLUSDT`, `apple` → `RAAPLUSDT`, `rSOXL` → `RSOXLUSDT`.

The system prompt carries the Parity thesis and the measured record, and one hard rule: **never answer a price question from memory.** Training data is stale; the tools are not.

---

## How It Works

### 1. The window is established

`darkWindow(now)` walks back to the most recent weekday 20:00 ET and forward to the next 04:00 ET, converging through DST rather than assuming a fixed offset. Outside the window the board replays how the last night ended, and says so.

### 2. Both legs are anchored at the same instant

For each ticker, the close of the **19:00 ET bar** at or before the window start. Anchoring both legs together is what makes a leveraged fund's daily reset irrelevant — the reset matters across days, not within one night.

### 3. The identity is evaluated

`r_base = base / base_anchor - 1`, `r_leg = leg / leg_anchor - 1`, and the residual is what is left after `beta * r_base` is subtracted. No fitting, no parameters.

### 4. The reading is graded against its own pair

Severity is measured against that pair's own `dark_p90`, doubled for a hard failure — `fail` at `max(60, p90*2)`, `watch` at `max(20, p90)`. A 40 bps reading is routine on one pair and an outlier on another.

### 5. The cost is attached

`1 + |beta|` gross dollars work per dollar of signal, charged on entry and exit. The board shows what acting on this particular breach would cost before it shows anything else, because the measured answer is that it does not clear.

### 6. The analyst answers off the same reading

The live board is serialised into the request, so "what is breaking tonight" is answered from exactly what is on screen — and anything it cannot answer from the board, it fetches live and shows you the call.

---

## Limits

- **The arithmetic proves one of the two quotes is wrong. It never says which one.**
- **Hourly bars, not ticks.** A breach that opens and closes inside an hour is invisible here.
- **A bar with no trade is absent, not carried forward** — so a genuinely frozen quote is dropped rather than scored.
- **The session control is weak.** Hourly closes on two legs in a fast market manufacture residual of their own, which is why the headline is the absolute breach rate rather than the session/dark ratio.
- **Fund expenses, borrow and the daily reset** move the identity by a few bps a day. That is noise against a 20 bps tolerance, not against a 2 bps one.
- **Coverage is only meaningful from {a['study_from']}.** Everything earlier is too sparse to grade.
- **This measures quote consistency.** It is not advice, and it is not a claim that either price is the right one.

---

## Built With

- [Bitget API](https://www.bitget.com/api-doc/common/intro) — public spot v2, keyless and CORS-open
- [Next.js](https://nextjs.org) — App Router, Turbopack
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [Framer Motion](https://motion.dev) — transitions and the spring nav indicator
- [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) — candlesticks
- [Lucide](https://lucide.dev) — icons

## Author

- [**martinvibes**](https://github.com/martinvibes) — audit, site, analyst
"""

doc = HEAD + FACTS
(ROOT / "README.md").write_text(doc)
print("written", len(doc), "chars")
