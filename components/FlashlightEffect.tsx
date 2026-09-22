"use client";
import React, { useEffect, useState } from "react";

/** A soft light that follows the cursor. Desktop only — it means nothing on touch. */
export function FlashlightEffect({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    if (window.innerWidth < 768) return () => window.removeEventListener("resize", check);

    const move = (e: MouseEvent) => {
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    };
    document.documentElement.style.setProperty("--mouse-x", `${window.innerWidth / 2}px`);
    document.documentElement.style.setProperty("--mouse-y", `${window.innerHeight / 2}px`);
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (isMobile) return <>{children}</>;

  return (
    <div className="relative w-full h-full">
      <div
        className="pointer-events-none fixed inset-0 z-50 transition duration-300"
        style={{ background: "radial-gradient(400px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(255,255,255,0.09), transparent 40%)" }}
      />
      {children}
    </div>
  );
}
