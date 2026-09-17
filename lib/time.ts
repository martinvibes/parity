const ET = "America/New_York";

const parts = (d: Date) => {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: ET, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const g = (t: string) => +(f.find((p) => p.type === t)?.value ?? 0);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour") % 24, min: g("minute") };
};

export const etHour = (d: Date) => parts(d).h;

/** A Date for a given ET wall-clock hour, resolved through the zone's own offset. */
export function etInstant(y: number, m: number, d: number, h: number): Date {
  const guess = Date.UTC(y, m - 1, d, h + 5);
  const p = parts(new Date(guess));
  return new Date(guess + (h - p.h) * 3.6e6);
}

export type Window = { start: Date; end: Date; active: boolean; elapsed: number; asOf: Date };

/** The dark window: 20:00 ET to 04:00 ET, when no US venue is behind the quote. */
export function darkWindow(now: Date): Window {
  const p = parts(now);
  const beforeOpen = p.h < 4;
  const base = beforeOpen ? new Date(+now - 864e5) : now;
  const b = parts(base);
  const start = etInstant(b.y, b.m, b.d, 20);
  const end = new Date(+start + 8 * 3.6e6);
  const active = now >= start && now < end;
  const asOf = active ? now : end;
  return { start, end, active, asOf, elapsed: Math.max(0, Math.min(1, (+asOf - +start) / (8 * 3.6e6))) };
}

export const fmtET = (d: Date, o: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat("en-US", { timeZone: ET, hour: "2-digit", minute: "2-digit", hour12: false, ...o }).format(d);
