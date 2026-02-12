"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { CheckfrontItem } from "@/lib/checkfront-types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/guided/item-card";
import { toArray } from "@/lib/utils";

export function StepItems({ state, updateState, onNext, session }: StepProps) {
  const [items, setItems] = useState<CheckfrontItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchItems() {
      try {
        const params = new URLSearchParams();
        if (state.categoryId) params.set("category_id", String(state.categoryId));
        if (state.startDate) params.set("start_date", state.startDate);
        if (state.endDate) params.set("end_date", state.endDate);
        for (const [key, val] of Object.entries(state.params)) {
          params.set(`param.${key}`, String(val));
        }

        const res = await fetch(`/api/items?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load activities");
        const data = await res.json();
        setItems(toArray(data.items || {}));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activities");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [state.categoryId, state.startDate, state.endDate, state.params]);

  async function handleSelect(item: CheckfrontItem) {
    updateState({
      selectedItem: item,
      selectedSlip: item.rate?.slip || null,
    });
  }

  async function handleNext() {
    if (!state.selectedSlip) return;

    setSubmitting(true);
    setError(null);

    // Create session with the selected SLIP
    const result = await session.createSession(state.selectedSlip, state.sessionId || undefined);
    if (result) {
      updateState({ sessionId: result.booking.session.id });
      onNext();
    } else {
      setError("Failed to add item to booking. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--color-error)]">{error}</div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Available Activities</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          {items.length} {items.length === 1 ? "option" : "options"} found for your dates
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] p-8 text-center">
          <p className="text-lg font-medium">No activities available</p>
          <p className="mt-2 text-[var(--color-muted)]">
            Try adjusting your dates or party size
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <ItemCard
              key={item.item_id}
              item={item}
              selected={state.selectedItem?.item_id === item.item_id}
              onSelect={() => handleSelect(item)}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}

      {state.selectedItem && (
        <div className="flex justify-end">
          <Button onClick={handleNext} disabled={submitting || !state.selectedSlip}>
            {submitting ? "Adding to booking..." : "Next: Review"}
          </Button>
        </div>
      )}
    </div>
  );
}
