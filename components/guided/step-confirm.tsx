"use client";

import { useState } from "react";
import type { StepProps } from "@/app/guided/page";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ACTIVITY_INFO } from "@/lib/constants";
import { formatCfDate, inclusiveDaysBetween, parseCfDate } from "@/lib/date-range";

export function StepCheckout({ state, session }: StepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(state.invoiceUrl);

  const activityInfo = state.selectedItemId
    ? ACTIVITY_INFO[state.selectedItemId]
    : null;

  const numDays =
    state.startDate && state.endDate
      ? inclusiveDaysBetween(
          parseCfDate(state.startDate),
          parseCfDate(state.endDate),
        )
      : 1;

  async function handleSubmit() {
    if (!state.sessionId) {
      setError("No active session. Please start over.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await session.createBooking(state.customerForm, state.sessionId);
    if (result?.booking?.invoice_url) {
      setInvoiceUrl(result.booking.invoice_url);
      // Redirect to Checkfront checkout
      window.location.href = result.booking.invoice_url;
    } else {
      setError("Failed to create booking. Please try again.");
      setSubmitting(false);
    }
  }

  if (invoiceUrl) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-success-light)">
          <span className="text-2xl">&#10003;</span>
        </div>
        <h2 className="text-2xl font-bold">Booking Created!</h2>
        <p className="text-(--color-muted)">
          Redirecting you to complete payment...
        </p>
        <Spinner size="md" />
        <a
          href={invoiceUrl}
          className="text-sm text-(--color-primary) underline"
        >
          Click here if not redirected automatically
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
        <p className="mt-1 text-(--color-muted)">
          Review everything one last time, then submit to proceed to payment
        </p>
      </div>

      <div className="space-y-4">
        {/* Activity summary */}
        <div className="rounded-lg border border-(--color-border) p-4">
          <h3 className="mb-2 font-semibold">Activity</h3>
          <p className="font-medium">
            {activityInfo?.name || state.ratedItem?.name}
          </p>
          {state.startDate && (
            <p className="text-sm text-(--color-muted)">
              {formatCfDate(state.startDate)}
              {state.endDate && state.endDate !== state.startDate && (
                <> to {formatCfDate(state.endDate)}</>
              )}
              {numDays > 1 && <> ({numDays} days)</>}
            </p>
          )}
          {Object.entries(state.params).map(([key, val]) => (
            <p key={key} className="text-sm text-(--color-muted)">
              <span className="capitalize">{key}</span>: {val}
            </p>
          ))}
          {state.ratedItem?.rate && (
            <p className="mt-2 text-lg font-bold">
              {state.ratedItem.rate.summary?.price?.total || "Price on request"}
            </p>
          )}
        </div>

        {/* Customer details */}
        <div className="rounded-lg border border-(--color-border) p-4">
          <h3 className="mb-2 font-semibold">Contact Details</h3>
          {Object.entries(state.customerForm).map(([key, value]) => (
            <p key={key} className="text-sm">
              <span className="capitalize text-(--color-muted)">
                {key.replace("customer_", "").replace(/_/g, " ")}
              </span>
              : {value}
            </p>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Processing...
            </span>
          ) : (
            "Complete Booking & Pay"
          )}
        </Button>
      </div>
    </div>
  );
}
