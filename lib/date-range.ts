import { format, parse, addDays, differenceInCalendarDays } from "date-fns";

/**
 * Convert a Date to YYYYMMDD string for Checkfront API.
 */
export function toCfDate(date: Date): string {
  return format(date, "yyyyMMdd");
}

/**
 * Parse a YYYYMMDD string into a Date.
 */
export function parseCfDate(dateStr: string): Date {
  return parse(dateStr, "yyyyMMdd", new Date());
}

/**
 * Calculate the INCLUSIVE end date given a start date and number of days.
 *
 * Sea Saba dive/snorkel items are "All Day" with inclusive end dates.
 * Example: 3 days starting Feb 12 → end = Feb 14 (NOT Feb 15)
 *
 * @param start - Start date
 * @param numDays - Number of days (must be >= 1)
 * @returns The inclusive end date
 */
export function addDaysInclusive(start: Date, numDays: number): Date {
  if (numDays < 1) throw new Error("numDays must be at least 1");
  return addDays(start, numDays - 1);
}

/**
 * Count the number of inclusive days between two dates.
 *
 * Example: Feb 12 to Feb 14 = 3 days (12th, 13th, 14th)
 *
 * @param start - Start date (inclusive)
 * @param end - End date (inclusive)
 * @returns Number of days in the range
 */
export function inclusiveDaysBetween(start: Date, end: Date): number {
  return differenceInCalendarDays(end, start) + 1;
}

/**
 * Format a YYYYMMDD string into a human-readable date.
 * Example: "20260212" → "February 12, 2026"
 */
export function formatCfDate(dateStr: string): string {
  const date = parseCfDate(dateStr);
  return format(date, "MMMM d, yyyy");
}

/**
 * Get today's date as a YYYYMMDD string.
 */
export function todayCfDate(): string {
  return toCfDate(new Date());
}
