import { NextRequest } from "next/server";
import { TOOLS, runTool } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const MODEL = process.env.LLM_MODEL || "gpt-4o";
const KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;

const SYSTEM = `You are the analyst on Parity, a desk that audits Bitget's overnight quotes for tokenized
US equities (rTokens) against the identities those quotes are required to satisfy.

WHAT PARITY KNOWS
A leveraged ETF is contractually built to deliver a fixed multiple of its index's return. SOXL targets 3x
SOXX; SOXS targets -3x the same index. Measured from a common anchor within one session that is arithmetic,
not a forecast. While a US venue is open (04:00-20:00 ET) arbitrage holds it. Between 20:00 and 04:00 ET
nothing does: each leg is quoted independently, and they stop agreeing. A residual means one of the two
quotes is wrong. It never says which one.

Measured over ~180 nights in 2026: 24.8% of observations sit more than 20 bps outside the identity, and the
breach does NOT close by the open — it never clears two sides of taker fee on gross notional. So these are
defects a trader pays, not opportunities a trader takes.

HOW TO ANSWER
1. For any question about a live price, what something is trading at, how something has moved, or what is
   moving today — CALL THE TOOLS. Never answer a price question from memory; your training data is stale and
   a wrong price is worse than no price. The tools cover crypto and rTokens alike.
2. For questions about the audit, use the DESK STATE given to you. Every figure you cite from it must appear
   there verbatim — never round, rescale or derive a new one.
3. Name specific instruments and specific numbers. "Some pairs look wide" is worthless.
4. Never say buy, sell, long, short, or give a price target. You describe what the measurement supports and
   where the risk sits.
5. Be brief. Three to six sentences of plain prose, no headings, no bullets, no markdown.
6. If the tools fail or the state lacks what is needed, say so plainly rather than guessing.`;

type Msg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

async function chat(messages: Msg[], useTools: boolean) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 800,
      messages,
      ...(useTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
    }),
  });
  if (!r.ok) throw new Error(`model endpoint returned ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export async function POST(req: NextRequest) {
  if (!KEY) {
    return Response.json(
      { error: "The analyst is not configured on this deployment. Set OPENAI_API_KEY to enable it. The board and the measured record are unaffected." },
      { status: 503 }
    );
  }

  let body: { question?: string; state?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "Bad request." }, { status: 400 }); }
  const question = (body.question || "").slice(0, 600).trim();
  const state = (body.state || "").slice(0, 16000);
  if (!question) return Response.json({ error: "Ask a question first." }, { status: 400 });

  const messages: Msg[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: `${state}\n\nQUESTION: ${question}` },
  ];
  const used: { name: string; args: Record<string, unknown>; result: unknown }[] = [];

  try {
    // Let the model reach for live data, then answer. Four rounds is plenty.
    for (let round = 0; round < 4; round++) {
      const d = await chat(messages, round < 3);
      const m = d?.choices?.[0]?.message;
      if (!m) return Response.json({ error: "The model returned nothing." }, { status: 502 });

      const calls = m.tool_calls as Msg["tool_calls"];
      if (!calls?.length) {
        return Response.json({
          text: String(m.content ?? "").trim(),
          tools: used.map((u) => ({ name: u.name, args: u.args, result: u.result })),
          model: MODEL,
        });
      }

      messages.push({ role: "assistant", content: m.content ?? null, tool_calls: calls });
      for (const c of calls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(c.function.arguments || "{}"); } catch { /* the model sent junk */ }
        const result = await runTool(c.function.name, args);
        used.push({ name: c.function.name, args, result });
        messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result).slice(0, 4000) });
      }
    }
    return Response.json({ error: "The analyst kept reaching for data without answering." }, { status: 502 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Could not reach the model." }, { status: 502 });
  }
}
