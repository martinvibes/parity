import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DeskProvider } from "@/lib/desk";
import Navbar from "@/components/Navbar";
import { FlashlightEffect } from "@/components/FlashlightEffect";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Parity — Overnight Quote Audit",
  description:
    "A leveraged ETF must move a fixed multiple of its index. Between 20:00 and 04:00 ET, Bitget's rToken quotes stop obeying that. Parity measures by how much, and what it costs to trade into.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={grotesk.variable}>
      <body className="bg-black text-white antialiased">
        <DeskProvider>
          <FlashlightEffect>
            <Navbar />
            <div className="pt-28 lg:pt-24">{children}</div>
            <Footer />
          </FlashlightEffect>
        </DeskProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 mt-20">
      <div className="container-custom py-10 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-black rotate-45" />
          </div>
          <span className="font-bold tracking-tight">Parity</span>
        </div>
        <p className="text-[13px] text-neon-secondary max-w-[46ch]">
          Every figure is computed from Bitget&apos;s own public candles. Nothing here is advice.
        </p>
        <div className="flex gap-5 ml-auto text-[13px]">
          <a className="text-gray-400 hover:text-white transition-colors" href="https://github.com/martinvibes/parity">Source</a>
          <a className="text-gray-400 hover:text-white transition-colors" href="/audit.json">audit.json</a>
        </div>
      </div>
    </footer>
  );
}
