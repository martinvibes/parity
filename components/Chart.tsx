"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode, type IChartApi, type ISeriesApi } from "lightweight-charts";

export type Bar = { time: number; open: number; high: number; low: number; close: number };

/** A real candlestick chart on Bitget's own OHLC, kept inside the monochrome palette. */
export default function Chart({ bars, height = 380 }: { bars: Bar[]; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [hover, setHover] = useState<Bar | null>(null);

  useEffect(() => {
    if (!box.current) return;
    const c = createChart(box.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a3a3a3",
        fontFamily: "var(--font-space-grotesk), sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)", timeVisible: true, secondsVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.35)", width: 1, style: 2, labelBackgroundColor: "#171717" },
        horzLine: { color: "rgba(255,255,255,0.35)", width: 1, style: 2, labelBackgroundColor: "#171717" },
      },
      handleScale: { axisPressedMouseMove: false },
    });
    const s = c.addCandlestickSeries({
      upColor: "#ffffff", downColor: "#3f3f46",
      borderUpColor: "#ffffff", borderDownColor: "#52525b",
      wickUpColor: "rgba(255,255,255,0.65)", wickDownColor: "rgba(255,255,255,0.3)",
    });
    chart.current = c;
    series.current = s;

    c.subscribeCrosshairMove((p) => {
      const d = p.seriesData.get(s) as Bar | undefined;
      setHover(d ?? null);
    });

    const ro = new ResizeObserver(() => box.current && c.applyOptions({ width: box.current.clientWidth }));
    ro.observe(box.current);
    c.applyOptions({ width: box.current.clientWidth });

    return () => { ro.disconnect(); c.remove(); chart.current = null; series.current = null; };
  }, [height]);

  useEffect(() => {
    if (!series.current || !bars.length) return;
    series.current.setData(bars as never);
    chart.current?.timeScale().fitContent();
  }, [bars]);

  const last = bars.at(-1);
  const shown = hover ?? last;
  const up = shown ? shown.close >= shown.open : true;

  return (
    <div className="relative">
      {shown && (
        <div className="absolute top-2 left-3 z-10 flex gap-4 text-[11px] tnum pointer-events-none">
          {(["open", "high", "low", "close"] as const).map((k) => (
            <span key={k}>
              <span className="text-neon-accent uppercase mr-1">{k[0]}</span>
              <span style={{ color: up ? "#fff" : "#a1a1aa" }}>{shown[k].toFixed(2)}</span>
            </span>
          ))}
        </div>
      )}
      <div ref={box} />
      {!bars.length && (
        <div className="absolute inset-0 grid place-items-center label-xs">loading candles…</div>
      )}
    </div>
  );
}
