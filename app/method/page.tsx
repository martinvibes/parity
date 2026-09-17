"use client";
import { useDesk } from "@/lib/desk";

export default function Method() {
  const { audit } = useDesk();

  return (
    <main className="max-w-[820px] mx-auto px-5 md:px-8 pb-16">
      <header className="pt-10 pb-6 rule-b">
        <h1 className="text-[26px] font-semibold tracking-[-0.025em] leading-none">Method</h1>
        <p className="text-[13.5px] text-[var(--color-ink-2)] mt-2">
          What is measured, how, and where it stops being true.
        </p>
      </header>

      <S n="01" t="The identity">
        <P>
          A leveraged ETF is built to deliver a fixed multiple of its index&apos;s return. SOXL targets three
          times SOXX; SOXS targets minus three times the same thing. That multiple is set in the fund&apos;s
          prospectus, not estimated by us. Measured from a common anchor over a single session, it reduces to
          one line of arithmetic:
        </P>
        <Eq>r_leg = β · r_base</Eq>
        <P>
          Everything left over is the residual, quoted in basis points. It is not a forecast, and it carries no
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
          pairs the session reads <em>wider</em> than the night for exactly that reason.
        </P>
        <P>
          So the headline here is the absolute breach rate, not the ratio between session and night. The
          absolute figure does not depend on the control being clean.
        </P>
      </S>

      <S n="04" t="Costs">
        <P>
          Holding one dollar of the leg against |β| dollars of the base means {audit ? "1 + |β|" : "1 + |β|"} dollars
          working for every dollar of signal, and you pay on the way in and the way out. At{" "}
          {audit?.fee_bps_per_side ?? 10} bps a side that is 80 bps round trip on a 3× pair and 40 on a mirror
          pair. Nothing in the record clears it.
        </P>
      </S>

      <S n="05" t="Limits">
        <Ul items={[
          "The arithmetic proves one of the two quotes is wrong. It never says which one.",
          "Hourly bars, not tick data. A breach that opens and closes inside an hour is invisible here.",
          "A bar with no trade is absent rather than carried forward, so a genuinely frozen quote is dropped rather than scored.",
          "Fund expenses, borrow and the daily reset all move the identity by a few basis points a day. That is noise against a 20 bps tolerance, not against a 2 bps one.",
          "Coverage of the dark window is only meaningful from " + (audit?.study_from ?? 2026) + ". Everything earlier is too sparse to grade.",
          "This measures quote consistency. It is not advice, and it is not a claim that either price is the right one.",
        ]} />
      </S>

      <S n="06" t="Reproducing it">
        <P>
          Everything comes from Bitget&apos;s public spot endpoints — no key, no account, no signing.{" "}
          <code className="num text-[12.5px]">scripts/fetch.py</code> pulls hourly candles for the fourteen
          tickers the identities touch; <code className="num text-[12.5px]">scripts/audit.py</code> grades them
          and writes <a className="link" href="/audit.json">audit.json</a>, which is the only source for every
          number on this site. The browser re-implements the same residual so the live board needs no server.
        </P>
      </S>
    </main>
  );
}

const S = ({ n, t, children }: { n: string; t: string; children: React.ReactNode }) => (
  <section className="py-7 rule-b">
    <div className="flex items-baseline gap-3 mb-3">
      <span className="seq">{n}</span>
      <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t}</h2>
    </div>
    <div className="pl-[26px] flex flex-col gap-3">{children}</div>
  </section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[14.5px] leading-[1.7] text-[var(--color-ink-2)]">{children}</p>
);

const Eq = ({ children }: { children: React.ReactNode }) => (
  <div className="num text-[15px] px-4 py-3 my-1" style={{ background: "var(--mark-wash)", color: "var(--color-ink)" }}>
    {children}
  </div>
);

const Ul = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-2">
    {items.map((i) => (
      <li key={i} className="text-[14px] leading-[1.65] text-[var(--color-ink-2)] flex gap-3">
        <span style={{ color: "var(--color-mark)" }}>—</span>{i}
      </li>
    ))}
  </ul>
);
