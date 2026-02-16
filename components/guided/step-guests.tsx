"use client";

import { useState } from "react";
import type { StepProps } from "@/app/guided/page";
import { Button } from "@/components/ui/button";
import { CF_ITEMS, ACTIVITY_INFO, type ItemParam } from "@/lib/constants";

const MAX_PER_PARAM = 20;

/** Activities that can have rental gear */
const DIVE_ITEMS: Set<number> = new Set([
  CF_ITEMS.advanced2Tank,
  CF_ITEMS.classic2Tank,
  CF_ITEMS.afternoonDive,
]);

export function StepGuests({ state, updateState, onNext }: StepProps) {
  const activityConfig = state.selectedItemId
    ? ACTIVITY_INFO[state.selectedItemId]
    : null;

  // Use ACTIVITY_INFO params directly — these are the known Checkfront param keys
  const paramDefs: ItemParam[] = activityConfig?.params.filter((p) => !p.isLocal) || [];

  const [params, setParams] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of paramDefs) {
      init[p.key] = state.params[p.key] ?? 0;
    }
    return init;
  });
  const [rentalGearCount, setRentalGearCount] = useState(state.rentalGearCount);
  const [error, setError] = useState<string | null>(null);

  const isDiveActivity = state.selectedItemId
    ? DIVE_ITEMS.has(state.selectedItemId)
    : false;
  const isSunsetCruise = state.selectedItemId === CF_ITEMS.sunsetCruise;

  function adjustParam(key: string, delta: number) {
    const current = params[key] || 0;
    const next = Math.max(0, Math.min(MAX_PER_PARAM, current + delta));
    setParams((prev) => ({ ...prev, [key]: next }));
  }

  function adjustRental(delta: number) {
    const totalDivers = Object.values(params).reduce((s, v) => s + v, 0);
    const next = Math.max(0, Math.min(totalDivers, rentalGearCount + delta));
    setRentalGearCount(next);
  }

  function getTotalGuests(): number {
    return Object.values(params).reduce((sum, val) => sum + val, 0);
  }

  function handleNext() {
    setError(null);
    const total = getTotalGuests();

    if (total === 0) {
      setError("Please add at least one guest.");
      return;
    }

    // Business rule: Sunset cruise minimum 8 guests
    if (isSunsetCruise && total < 8) {
      setError(
        "Sunset cruises require a minimum of 8 guests. If you have fewer than 8, " +
        "please contact us to join an existing group or book a private cruise (pay for 8 at $400 total). " +
        "WhatsApp: +599-416-2246",
      );
      return;
    }

    // Cap rental gear to total divers
    const cappedRental = Math.min(rentalGearCount, total);

    updateState({
      params,
      rentalGearCount: cappedRental,
      // Reset rated data when params change
      ratedItem: null,
      selectedSlip: null,
      sessionId: null,
    });
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">How many in your group?</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          Set the group size for {activityConfig?.name || "your activity"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {paramDefs.map((p) => (
          <div
            key={p.key}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4"
          >
            <span className="font-medium">{p.label}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                onClick={() => adjustParam(p.key, -1)}
                disabled={(params[p.key] || 0) <= 0}
                aria-label={`Decrease ${p.label}`}
              >
                -
              </button>
              <span className="w-8 text-center text-lg font-semibold">
                {params[p.key] || 0}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                onClick={() => adjustParam(p.key, 1)}
                disabled={(params[p.key] || 0) >= MAX_PER_PARAM}
                aria-label={`Increase ${p.label}`}
              >
                +
              </button>
            </div>
          </div>
        ))}

        {/* Rental equipment for dive activities */}
        {isDiveActivity && getTotalGuests() > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div>
              <span className="font-medium">Full Rental Gear</span>
              <p className="text-xs text-[var(--color-muted)]">
                BCD, regulator, wetsuit, mask, fins, dive computer
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                onClick={() => adjustRental(-1)}
                disabled={rentalGearCount <= 0}
                aria-label="Decrease rental gear"
              >
                -
              </button>
              <span className="w-8 text-center text-lg font-semibold">
                {rentalGearCount}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                onClick={() => adjustRental(1)}
                disabled={rentalGearCount >= getTotalGuests()}
                aria-label="Increase rental gear"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sunset cruise minimum reminder */}
      {isSunsetCruise && (
        <p className="text-sm text-[var(--color-warning)]">
          Sunset cruises require a minimum of 8 guests ($50/person).
        </p>
      )}

      {error && (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next: Review Pricing</Button>
      </div>
    </div>
  );
}
