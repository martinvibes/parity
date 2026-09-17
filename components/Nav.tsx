"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDesk } from "@/lib/desk";

const ROUTES = [
  ["/", "Brief"],
  ["/board", "Board"],
  ["/evidence", "Evidence"],
  ["/method", "Method"],
] as const;

export default function Nav() {
  const path = usePathname();
  const { win, index } = useDesk();

  return (
    <header className="rule-b sticky top-0 z-50" style={{ background: "var(--paper)" }}>
      <div className="max-w-[1180px] mx-auto px-5 md:px-8 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-baseline gap-2.5 shrink-0">
          <Mark />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Parity</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {ROUTES.map(([href, label]) => {
            const on = path === href;
            return (
              <Link key={href} href={href}
                    className="px-2.5 py-1 text-[13px] whitespace-nowrap transition-colors"
                    style={{
                      color: on ? "var(--color-ink)" : "var(--color-ink-3)",
                      boxShadow: on ? "inset 0 -2px 0 var(--color-mark)" : undefined,
                    }}>
                {label}
              </Link>
            );
          })}
        </nav>

        <span className="flex-1" />

        <span className="cap hidden sm:inline">
          {win ? (win.active ? "market dark" : "us open") : "—"}
        </span>
        {index !== null && (
          <span className="num text-[13px] shrink-0"
                style={{ color: index >= 20 ? "var(--color-fail)" : "var(--color-ink)" }}>
            {index.toFixed(1)}<span className="cap ml-1">bps</span>
          </span>
        )}
      </div>
    </header>
  );
}

/** Two rules that should be parallel, and are not. */
function Mark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0 -mb-px">
      <line x1="1.5" y1="5" x2="14.5" y2="5" stroke="var(--color-ink)" strokeWidth="1.6" />
      <line x1="1.5" y1="11.6" x2="14.5" y2="9.4" stroke="var(--color-fail)" strokeWidth="1.6" />
    </svg>
  );
}
