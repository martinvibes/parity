import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DeskProvider } from "@/lib/desk";
import Nav from "@/components/Nav";

const sans = Archivo({ subsets: ["latin"], variable: "--font-archivo", weight: ["400", "500", "600", "700"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Parity — overnight quote audit",
  description:
    "A leveraged ETF must move a fixed multiple of its index. Between 20:00 and 04:00 ET, Bitget's rToken quotes stop obeying that. Parity measures by how much, and what it costs to trade into.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <DeskProvider>
          <Nav />
          {children}
          <Foot />
        </DeskProvider>
      </body>
    </html>
  );
}

function Foot() {
  return (
    <footer className="rule-t mt-16">
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 py-7 flex flex-wrap gap-x-8 gap-y-2 items-baseline">
        <span className="cap">Parity</span>
        <span className="text-[12.5px] text-[var(--color-ink-2)]">
          Every figure is computed from Bitget&apos;s own public candles. Nothing here is advice.
        </span>
        <span className="flex-1" />
        <a className="link text-[12.5px]" href="https://github.com/martinvibes/parity">source</a>
        <a className="link text-[12.5px]" href="/audit.json">audit.json</a>
      </div>
    </footer>
  );
}
