// src/lib/date.ts

/**
 * @file date.ts
 * @brief Utilities for handling and formatting dates in an EU locale.
 */

/**
 * @var EU_LOCALE
 * @brief Best-match EU locale based on the user's browser settings.
 * @details Prioritizes French ("fr"), Dutch ("nl"), or British English ("en-GB") as found in
 * navigator.languages. Falls back to navigator.language or "fr-BE" as a default.
 */
export const EU_LOCALE =
  navigator.languages?.find(l => l.startsWith("fr") || l.startsWith("nl") || l === "en-GB") ||
  navigator.language ||
  "fr-BE";

/**
 * @fn parseAPIDate
 * @brief Parses an API date string into a local Date object (safe for "YYYY-MM-DD" or ISO).
 * @param {string} s The API date string (format: "YYYY-MM-DD" or ISO string).
 * @returns {Date} JavaScript Date object set to noon local time for given date.
 * @details Noon local is used to avoid timezone flips when parsing.
 */
export function parseAPIDate(s: string): Date {
  const ymd = (s || "").slice(0, 10); // "YYYY-MM-DD"
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y || 0, (m || 1) - 1, d || 1, 12, 0, 0); // noon local avoids TZ flips
}

/**
 * @fn fmtDate
 * @brief Formats a Date as "DD MMM YYYY" (or with a long month) in the EU locale.
 * @param {Date} d The Date to format.
 * @param {Intl.DateTimeFormatOptions} [opts] Optional formatting options (defaults to long month).
 * @returns {string} The formatted date string in EU locale.
 */
export function fmtDate(d: Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(
    EU_LOCALE,
    opts ?? { day: "2-digit", month: "long", year: "numeric" }
  ).format(d);
}

/**
 * @fn fmtWeekday
 * @brief Formats a Date to produce the localized full weekday name in the EU locale.
 * @param {Date} d The Date whose weekday is to be formatted.
 * @returns {string} The weekday label (e.g., "Monday", "lundi", "maandag") in EU locale.
 */
export function fmtWeekday(d: Date): string {
  return new Intl.DateTimeFormat(EU_LOCALE, { weekday: "long" }).format(d);
}
