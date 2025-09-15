// src/lib/date.ts
export const EU_LOCALE =
  navigator.languages?.find(l => l.startsWith("fr") || l.startsWith("nl") || l === "en-GB") ||
  navigator.language ||
  "fr-BE";

/** Parse an API date string to a local Date (safe for YYYY-MM-DD or ISO). */
export function parseAPIDate(s: string): Date {
  const ymd = (s || "").slice(0, 10); // "YYYY-MM-DD"
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y || 0, (m || 1) - 1, d || 1, 12, 0, 0); // noon local avoids TZ flips
}

/** Format a Date as DD MMM YYYY (or long month) in EU locale. */
export function fmtDate(d: Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(
    EU_LOCALE,
    opts ?? { day: "2-digit", month: "long", year: "numeric" }
  ).format(d);
}

/** Weekday label in EU locale. */
export function fmtWeekday(d: Date): string {
  return new Intl.DateTimeFormat(EU_LOCALE, { weekday: "long" }).format(d);
}
