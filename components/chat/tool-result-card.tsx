"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ToolResultCardProps {
  toolName: string;
  result: unknown;
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  const data = result as Record<string, unknown>;

  switch (toolName) {
    case "rateItem":
      return <RateCard data={data} />;
    case "checkAvailability":
      return <CalendarCard data={data} />;
    case "addToSession":
      return <SessionCard data={data} />;
    case "createBooking":
      return <CheckoutCard data={data} />;
    case "clearSession":
      return (
        <div className="rounded border border-[var(--color-border)] p-2 text-xs text-[var(--color-muted)]">
          Session cleared
        </div>
      );
    case "prepareContactRequest":
      return <ContactRequestCard data={data} />;
    default:
      return null;
  }
}

function RateCard({ data }: { data: Record<string, unknown> }) {
  const name = data.name as string | undefined;
  const price = data.price as string | undefined;
  const available = data.available as number | undefined;
  const status = data.status as string | undefined;

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{name}</p>
        {price && (
          <span className="whitespace-nowrap font-bold">{price}</span>
        )}
      </div>
      <div className="mt-1">
        <Badge
          variant={
            status === "UNAVAILABLE" || available === 0 ? "error" : "success"
          }
        >
          {status === "UNAVAILABLE" || available === 0
            ? "Unavailable"
            : "Available"}
        </Badge>
      </div>
    </div>
  );
}

function CalendarCard({ data }: { data: Record<string, unknown> }) {
  const dates = (data.dates || {}) as Record<string, number>;
  const entries = Object.entries(dates);

  if (entries.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm">
        No availability data found.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {entries.slice(0, 14).map(([date, stock]) => {
        const isAvailable = stock > 0;
        return (
          <div
            key={date}
            className={`rounded px-2 py-1 text-xs ${
              isAvailable
                ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                : "bg-[var(--color-error-light)] text-[var(--color-error)]"
            }`}
          >
            {date.slice(4, 6)}/{date.slice(6, 8)} ({stock})
          </div>
        );
      })}
    </div>
  );
}

function SessionCard({ data }: { data: Record<string, unknown> }) {
  const total = data.total as number | undefined;

  return (
    <div className="rounded border border-[var(--color-success)] bg-[var(--color-success-light)] p-3">
      <p className="text-sm font-medium text-[var(--color-success)]">
        Added to booking!
      </p>
      {total !== undefined && (
        <p className="mt-1 text-sm">
          Total: <span className="font-bold">{formatCurrency(total)}</span>
        </p>
      )}
    </div>
  );
}

function CheckoutCard({ data }: { data: Record<string, unknown> }) {
  const invoiceUrl = data.invoice_url as string | undefined;
  const bookingId = data.booking_id as string | undefined;
  const [countdown, setCountdown] = useState(3);

  // Auto-redirect after 3 seconds
  useEffect(() => {
    if (!invoiceUrl) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.open(invoiceUrl, "_blank");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [invoiceUrl]);

  return (
    <div className="rounded-lg border-2 border-[var(--color-success)] bg-[var(--color-success-light)] p-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">✅</span>
        <p className="text-lg font-bold text-[var(--color-success)]">
          Booking Created!
        </p>
      </div>
      {bookingId && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Reference: {bookingId}
        </p>
      )}
      {invoiceUrl && (
        <>
          <p className="mt-3 text-sm">
            {countdown > 0
              ? `Opening checkout in ${countdown}s...`
              : "Checkout opened in a new tab."}
          </p>
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Complete Payment & Sign Waivers →
          </a>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Didn&apos;t open?{" "}
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Click here
            </a>
          </p>
        </>
      )}
    </div>
  );
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  sunset_cruise_under_minimum: "Sunset Cruise (Group Coordination)",
  discover_scuba: "Discover Scuba Diving",
  open_water_course: "Open Water Course",
  advanced_course: "Advanced Open Water Course",
  technical_diving: "Technical Diving",
  private_charter: "Private Charter",
  fishing: "Fishing Trip",
  group_event: "Group Event",
  other: "Special Request",
};

function ContactRequestCard({ data }: { data: Record<string, unknown> }) {
  const name = data.customer_name as string | undefined;
  const email = data.customer_email as string | undefined;
  const phone = data.customer_phone as string | undefined;
  const requestType = data.request_type as string | undefined;
  const dates = data.preferred_dates as string | undefined;
  const guests = data.guest_count as number | undefined;
  const details = data.details as string | undefined;
  const whatsapp = data.whatsapp as string | undefined;

  return (
    <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-light)] p-4">
      <p className="mb-2 text-sm font-semibold text-[var(--color-primary)]">
        Contact Request Prepared
      </p>
      {requestType && (
        <p className="mb-1 text-sm font-medium">
          {REQUEST_TYPE_LABELS[requestType] || requestType}
        </p>
      )}

      <div className="mt-2 space-y-1 text-xs">
        {name && (
          <p>
            <span className="text-[var(--color-muted)]">Name:</span> {name}
          </p>
        )}
        {email && (
          <p>
            <span className="text-[var(--color-muted)]">Email:</span> {email}
          </p>
        )}
        {phone && (
          <p>
            <span className="text-[var(--color-muted)]">Phone:</span> {phone}
          </p>
        )}
        {dates && (
          <p>
            <span className="text-[var(--color-muted)]">Dates:</span> {dates}
          </p>
        )}
        {guests !== undefined && (
          <p>
            <span className="text-[var(--color-muted)]">Guests:</span> {guests}
          </p>
        )}
        {details && (
          <p>
            <span className="text-[var(--color-muted)]">Details:</span>{" "}
            {details}
          </p>
        )}
      </div>

      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1fba59]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.597-1.464A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.331 0-4.512-.7-6.328-1.9l-.454-.27-2.724.867.81-2.629-.296-.471A9.709 9.709 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
          </svg>
          Chat on WhatsApp
        </a>
      )}
    </div>
  );
}
