"use client";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import Orbs from "@/components/Orbs";
import { useDesk } from "@/lib/desk";

const fadeInUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };

export default function Method() {
  const { audit } = useDesk();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <Orbs />
      <main className="relative z-10 max-w-[900px] mx-auto px-6 md:px-8 pt-8 pb-20">

        <motion.header variants={fadeInUp} initial="hidden" animate="show" className="pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Method</h1>
          <p className="text-gray-400 text-sm mt-3">What is measured, how, and where it stops being true.</p>
        </motion.header>

        <S n="01" t="The identity">
          <P>
            A leveraged ETF is built to deliver a fixed multiple of its index&apos;s return. SOXL targets three
            times SOXX; SOXS targets minus three times the same thing. That multiple is set in the fund&apos;s
            prospectus, not estimated by us. Measured from a common anchor over a single session, it reduces to
            one line of arithmetic:
          </P>
          <Eq>r_leg = β · r_base</Eq>
          <P>
            Everything left over is the residual, quoted in basis points. It is not a forecast and it carries no
            view about where anything is going. It says only that two prices the venue is publishing at the same
            moment cannot both be right.
          </P>
        </S>

        <S n="02" t="The anchor and the window">
          <P>
            rTokens route to NYSE and Nasdaq while those venues are open, which on Bitget is 04:00 to 20:00 ET.
            Outside that there is no market behind the price. Each night is anchored on the close of the 19:00 ET
            bar — the 20:00 session close — and every hourly bar from 20:00 through 04:00 is checked against it.
          </P>
          <P>
            Anchoring both legs at the same instant is what makes the daily reset of a leveraged fund irrelevant
            here. The reset matters for holding across days; within one night it does not.
          </P>
        </S>

        <S n="03" t="The control, and why it is weak">
          <P>
            The same arithmetic run between 10:00 and 16:00 ET is the control: arbitrage is live then, so the
            residual should be small. It mostly is. But hourly closes on two different instruments in a fast
            market are not simultaneous, and that timing mismatch manufactures residual of its own. For a few
            pairs the session reads <em className="text-white not-italic font-medium">wider</em> than the night
            for exactly that reason.
          </P>
          <P>
            So the headline here is the absolute breach rate, not the ratio between session and night. The
            absolute figure does not depend on the control being clean.
          </P>
        </S>

        <S n="04" t="Costs">
          <P>
            Holding one dollar of the leg against |β| dollars of the base means 1 + |β| dollars working for every
            dollar of signal, and you pay on the way in and the way out. At{" "}
            <span className="tnum text-white">{audit?.fee_bps_per_side ?? 10} bps</span> a side that is 80 bps
            round trip on a 3× pair and 40 on a mirror pair. Nothing in the record clears it.
          </P>
        </S>

        <S n="05" t="The analyst">
          <P>
            The research desk runs on a model with three tools wired to Bitget&apos;s public market API: a spot
            price, recent candles, and the day&apos;s movers. It is instructed never to answer a price question
            from memory — every figure it quotes came back from a call it made while you watched, and the chips
            above each answer name the tool it reached for. The board&apos;s own state is handed to it as
            context, so &quot;what is breaking tonight&quot; is answered from the same reading you can see.
          </P>
        </S>

        <S n="06" t="Limits">
          <Ul items={[
            "The arithmetic proves one of the two quotes is wrong. It never says which one.",
            "Hourly bars, not tick data. A breach that opens and closes inside an hour is invisible here.",
            "A bar with no trade is absent rather than carried forward, so a genuinely frozen quote is dropped rather than scored.",
            "Fund expenses, borrow and the daily reset all move the identity by a few basis points a day. That is noise against a 20 bps tolerance, not against a 2 bps one.",
            "Coverage of the dark window is only meaningful from " + (audit?.study_from ?? 2026) + ". Everything earlier is too sparse to grade.",
            "This measures quote consistency. It is not advice, and it is not a claim that either price is the right one.",
          ]} />
        </S>

        <S n="07" t="Reproducing it">
          <P>
            Everything comes from Bitget&apos;s public spot endpoints — no key, no account, no signing.{" "}
            <Code>scripts/fetch.py</Code> pulls hourly candles for the fourteen tickers the identities touch;{" "}
            <Code>scripts/audit.py</Code> grades them and writes{" "}
            <a className="text-white underline underline-offset-4 decoration-white/30 hover:decoration-white" href="/audit.json">audit.json</a>,
            which is the only source for every number on this site. The browser re-implements the same residual,
            so the live board needs no server of ours at all.
          </P>
        </S>
      </main>
    </div>
  );
}

const S = ({ n, t, children }: { n: string; t: string; children: React.ReactNode }) => (
  <motion.section variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
                  className="py-7 border-t border-white/10">
    <div className="flex items-baseline gap-3 mb-3.5">
      <span className="tnum text-[11px] text-gray-600">{n}</span>
      <h2 className="text-lg md:text-xl font-bold tracking-tighter">{t}</h2>
    </div>
    <div className="pl-[30px] flex flex-col gap-3.5">{children}</div>
  </motion.section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[14.5px] leading-[1.75] text-gray-400">{children}</p>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="tnum text-[12.5px] rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-gray-200">{children}</code>
);

const Eq = ({ children }: { children: React.ReactNode }) => (
  <GlassCard className="px-5 py-4 my-1">
    <span className="tnum text-base text-white">{children}</span>
  </GlassCard>
);

const Ul = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-2.5">
    {items.map((i) => (
      <li key={i} className="text-[14px] leading-[1.7] text-gray-400 flex gap-3">
        <span className="text-white/40 select-none">—</span>{i}
      </li>
    ))}
  </ul>
);
