"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { CheckfrontItem } from "@/lib/checkfront-types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { stripHtml } from "@/lib/utils";
import { formatCfDate, inclusiveDaysBetween, parseCfDate } from "@/lib/date-range";
import { ACTIVITY_INFO, CF_ITEMS } from "@/lib/constants";

export function StepReview({ state, updateState, onNext, session }: StepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratedItem, setRatedItem] = useState<CheckfrontItem | null>(
    state.ratedItem,
  );
  const [submitting, setSubmitting] = useState(false);

  const activityInfo = state.selectedItemId
    ? ACTIVITY_INFO[state.selectedItemId]
    : null;

  // Fetch rated pricing from Checkfront
  useEffect(() => {
    async function fetchPricing() {
      if (!state.selectedItemId || !state.startDate || !state.endDate) {
        setError("Missing booking details. Please go back and try again.");
        setLoading(false);
        return;
      }

      // If we already have rated data, don't refetch
      if (state.ratedItem) {
        setRatedItem(state.ratedItem);
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("start_date", state.startDate);
        params.set("end_date", state.endDate);
        for (const [key, val] of Object.entries(state.params)) {
          params.set(`param.${key}`, String(val));
        }

        const res = await fetch(
          `/api/items/${state.selectedItemId}?${params.toString()}`,
        );
        if (!res.ok) throw new Error("Failed to load pricing");
        const data = await res.json();

        // The single-item endpoint returns the item directly
        const item = data.item as CheckfrontItem | undefined;
        if (!item) throw new Error("Activity not found");

        setRatedItem(item);
        updateState({
          ratedItem: item,
          selectedSlip: item.rate?.slip || null,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load pricing",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedItemId, state.startDate, state.endDate]);

  async function handleConfirm() {
    if (!state.selectedSlip) {
      setError("No booking token available. Please go back and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await session.createSession(
      state.selectedSlip,
      state.sessionId || undefined,
    );
    if (result) {
      updateState({ sessionId: result.booking.session.id });
      onNext();
    } else {
      setError("Failed to add to booking. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--color-muted)]">
          Checking availability and pricing...
        </p>
      </div>
    );
  }

  if (error && !ratedItem) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--color-error)]">{error}</p>
      </div>
    );
  }

  const isUnavailable =
    ratedItem?.rate?.status === "UNAVAILABLE" ||
    ratedItem?.rate?.available === 0;

  const numDays =
    state.startDate && state.endDate
      ? inclusiveDaysBetween(
          parseCfDate(state.startDate),
          parseCfDate(state.endDate),
        )
      : 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Confirm Pricing</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          Verify the details and pricing below, then continue to enter your
          details
        </p>
      </div>

      {/* Booking Summary Card */}
      <div className="rounded-lg border border-[var(--color-border)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              {activityInfo?.name || ratedItem?.name}
            </h3>
            {ratedItem?.summary && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {stripHtml(ratedItem.summary)}
              </p>
            )}
          </div>
          {isUnavailable ? (
            <Badge variant="error">Unavailable</Badge>
          ) : (
            <Badge variant="success">Available</Badge>
          )}
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          {state.startDate && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">
                {numDays === 1 ? "Date" : "Start Date"}
              </span>
              <span>{formatCfDate(state.startDate)}</span>
            </div>
          )}
          {state.endDate && numDays > 1 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">End Date</span>
              <span>{formatCfDate(state.endDate)}</span>
            </div>
          )}
          {numDays > 1 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Duration</span>
              <span>{numDays} days</span>
            </div>
          )}
          {Object.entries(state.params).map(([key, val]) => {
            const paramLabel =
              activityInfo?.params.find((p) => p.key === key)?.label || key;
            return (
              <div key={key} className="flex justify-between">
                <span className="text-[var(--color-muted)]">{paramLabel}</span>
                <span>{val}</span>
              </div>
            );
          })}
          {state.rentalGearCount > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Full Rental Gear</span>
              <span>{state.rentalGearCount}</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        {ratedItem?.rate && !isUnavailable && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[var(--color-muted)]">Total Price</span>
              <span className="text-2xl font-bold">
                {ratedItem.rate.summary?.price?.total || "Price on request"}
              </span>
            </div>
            {ratedItem.rate.summary?.price?.unit && (
              <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
                {ratedItem.rate.summary.price.unit}
              </p>
            )}
          </div>
        )}

        {isUnavailable && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <p className="text-sm text-[var(--color-error)]">
              This activity is not available for your selected dates. Please go
              back and choose different dates.
            </p>
          </div>
        )}
      </div>

      {/* Additional fees note */}
      <p className="text-xs text-[var(--color-muted)]">
        Marine Park Fee ($3) and Hyperbaric Chamber Fee ($1) per dive are
        included in the pricing above.
      </p>

      {error && (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleConfirm}
          disabled={submitting || isUnavailable || !state.selectedSlip}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Adding to booking...
            </span>
          ) : (
            "Next: Your Details"
          )}
        </Button>
      </div>
    </div>
  );
}
