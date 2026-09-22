"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useDesk } from "@/lib/desk";

const NAV = [
  { path: "/", label: "Home" },
  { path: "/board", label: "Board" },
  { path: "/research", label: "Research" },
  { path: "/evidence", label: "Evidence" },
  { path: "/method", label: "Method" },
];

export default function Navbar() {
  const path = usePathname();
  const { index, win } = useDesk();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-24 flex items-center justify-center px-4 md:px-6 pointer-events-none"
    >
      <div className="w-full max-w-7xl flex items-center justify-between pointer-events-auto gap-4">
        <Link href="/" className="group flex items-center gap-3 no-underline shrink-0">
          <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transition-all duration-300">
            <div className="w-4 h-4 border-2 border-black rotate-45 group-hover:rotate-90 transition-transform duration-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight">Parity</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Overnight Quote Audit</span>
          </div>
        </Link>

        <div className="hidden lg:flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 items-center gap-1 shadow-2xl">
          {NAV.map((item) => {
            const active = path === item.path;
            return (
              <Link key={item.path} href={item.path}
                    className={cn("relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300",
                      active ? "text-neon-primary" : "text-gray-400 hover:text-white")}>
                {active && (
                  <motion.span layoutId="navbar-active-indicator"
                               className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.12)]"
                               transition={{ type: "spring", bounce: 0.25, duration: 0.5 }} />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="label-xs">{win?.active ? "live disagreement" : "at last close"}</span>
            <span className="tnum text-[15px] font-semibold leading-tight">
              {index !== null ? `${index.toFixed(1)} bps` : "—"}
            </span>
          </div>
          <Link href="/board"
                className="px-4 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:shadow-[0_0_25px_rgba(255,255,255,0.45)] transition-all duration-300 hover:scale-105">
            Board
          </Link>
        </div>
      </div>

      {/* Routes still need to be reachable on a narrow screen. */}
      <div className="lg:hidden absolute top-[72px] left-0 right-0 px-4">
        <div className="flex gap-1 overflow-x-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 pointer-events-auto"
             style={{ scrollbarWidth: "none" }}>
          {NAV.map((item) => (
            <Link key={item.path} href={item.path}
                  className={cn("px-4 py-2 rounded-full text-[13px] whitespace-nowrap transition-colors",
                    path === item.path ? "text-white bg-white/10" : "text-gray-400")}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}
