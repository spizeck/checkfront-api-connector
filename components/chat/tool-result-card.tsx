"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ToolResultCardProps {
  toolName: string;
  result: unknown;
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  const data = result as Record<string, unknown>;

  switch (toolName) {
    case "getCategories":
      return <CategoriesCard data={data} />;
    case "searchItems":
      return <ItemsCard data={data} />;
    case "checkAvailability":
      return <CalendarCard data={data} />;
    case "addToSession":
      return <SessionCard data={data} />;
    case "createBooking":
      return <CheckoutCard data={data} />;
    case "getBookingFormFields":
      return <FormFieldsCard data={data} />;
    case "clearSession":
      return (
        <div className="rounded border border-[var(--color-border)] p-2 text-xs text-[var(--color-muted)]">
          Session cleared
        </div>
      );
    default:
      return null;
  }
}

function CategoriesCard({ data }: { data: Record<string, unknown> }) {
  const categories = (data.categories || []) as Array<{
    category_id: number;
    name: string;
    description: string;
    item_count: number;
  }>;

  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <div
          key={cat.category_id}
          className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2"
        >
          <span className="font-medium">{cat.name}</span>
          {cat.description && (
            <span className="ml-2 text-xs text-[var(--color-muted)]">
              {cat.description}
            </span>
          )}
          <Badge variant="neutral" className="ml-2">
            {cat.item_count} items
          </Badge>
        </div>
      ))}
    </div>
  );
}

function ItemsCard({ data }: { data: Record<string, unknown> }) {
  const items = (data.items || []) as Array<{
    item_id: number;
    name: string;
    summary: string;
    available: boolean;
    stock: number;
    price?: number;
    price_summary?: string;
    image_url?: string;
  }>;

  if (items.length === 0) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm">
        No items found for the specified criteria.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.item_id}
          className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.name}</p>
              {item.summary && (
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {item.summary}
                </p>
              )}
            </div>
            {item.price !== undefined && (
              <span className="whitespace-nowrap font-bold">
                {formatCurrency(item.price)}
              </span>
            )}
          </div>
          <div className="mt-1">
            <Badge
              variant={
                item.available === false
                  ? "error"
                  : item.stock <= 3
                    ? "warning"
                    : "success"
              }
            >
              {item.available === false
                ? "Unavailable"
                : item.stock <= 3
                  ? `${item.stock} left`
                  : "Available"}
            </Badge>
          </div>
        </div>
      ))}
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
  const summary = data.summary as {
    sub_total: number;
    tax_total: number;
    total: number;
  } | undefined;

  return (
    <div className="rounded border border-[var(--color-success)] bg-[var(--color-success-light)] p-3">
      <p className="text-sm font-medium text-[var(--color-success)]">
        Added to booking!
      </p>
      {summary && (
        <p className="mt-1 text-sm">
          Total: <span className="font-bold">{formatCurrency(summary.total)}</span>
        </p>
      )}
    </div>
  );
}

function CheckoutCard({ data }: { data: Record<string, unknown> }) {
  const invoiceUrl = data.invoice_url as string | undefined;
  const bookingId = data.booking_id as string | undefined;

  return (
    <div className="rounded border border-[var(--color-success)] bg-[var(--color-success-light)] p-4">
      <p className="font-semibold text-[var(--color-success)]">
        Booking Created!
      </p>
      {bookingId && (
        <p className="mt-1 text-sm">Booking ID: {bookingId}</p>
      )}
      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
        >
          Complete Payment
        </a>
      )}
    </div>
  );
}

function FormFieldsCard({ data }: { data: Record<string, unknown> }) {
  const fields = (data.fields || []) as Array<{
    field_name: string;
    label: string;
    required: boolean;
  }>;

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-xs">
      <p className="mb-1 font-medium">Required information:</p>
      <ul className="list-inside list-disc text-[var(--color-muted)]">
        {fields
          .filter((f) => f.required)
          .map((f) => (
            <li key={f.field_name}>{f.label}</li>
          ))}
      </ul>
    </div>
  );
}
