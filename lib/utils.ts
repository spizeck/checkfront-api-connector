import { format, parse } from "date-fns";
import { NextResponse } from "next/server";
import { CheckfrontApiError, CheckfrontRateLimitError } from "./checkfront-client";

/** Convert a JS Date to YYYYMMDD string for Checkfront API */
export function toCheckfrontDate(date: Date): string {
  return format(date, "yyyyMMdd");
}

/** Convert YYYYMMDD string from Checkfront to a JS Date */
export function fromCheckfrontDate(dateStr: string): Date {
  return parse(dateStr, "yyyyMMdd", new Date());
}

/** Format currency amount */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Extract values array from Checkfront's object-keyed response */
export function toArray<T>(obj: Record<string, T>): T[] {
  return Object.values(obj);
}

/** Build a display-friendly availability label */
export function availabilityLabel(stock: number, unlimited: number | boolean): string {
  if (unlimited) return "Available";
  if (stock <= 0) return "Sold out";
  if (stock <= 3) return `Only ${stock} left`;
  return "Available";
}

/** Extract the first image URL from a Checkfront item image object */
export function getItemImageUrl(image: Record<string, { url?: string; url_medium?: string; url_small?: string }> | string | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  const first = Object.values(image)[0];
  return first?.url_medium || first?.url || null;
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

/** Parse a price string like "$150.00" to a number */
export function parsePriceString(price: string): number {
  const cleaned = price.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}

/** Standardized error response for API routes */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof CheckfrontRateLimitError) {
    return NextResponse.json(
      { error: "Service is busy. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(error.retryAfterSeconds) },
      },
    );
  }
  if (error instanceof CheckfrontApiError) {
    return NextResponse.json(
      { error: "Booking service error. Please try again." },
      { status: error.status >= 500 ? 502 : error.status },
    );
  }
  console.error("Unexpected error:", error);
  return NextResponse.json(
    { error: "An unexpected error occurred." },
    { status: 500 },
  );
}
