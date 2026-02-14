"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { BookingParam, CheckfrontItem } from "@/lib/checkfront-types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toArray } from "@/lib/utils";
import { CF_ITEMS, ACTIVITY_INFO } from "@/lib/constants";

/** Only show customer-visible, unlocked params with a valid range */
function isVisibleParam(param: BookingParam): boolean {
  if (param.hide === 1 || param.customer_hide === 1) return false;
  if (param.lock === 1) return false;
  if (param.MAX === 0 && param.MIN === 0) return false;
  return true;
}

export function StepGuests({ state, updateState, onNext }: StepProps) {
  const [paramDefs, setParamDefs] = useState<Record<string, BookingParam>>({});
  const [params, setParams] = useState<Record<string, number>>(state.params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activityName = state.selectedItemId
    ? ACTIVITY_INFO[state.selectedItemId]?.name
    : "your activity";

  const isSunsetCruise = state.selectedItemId === CF_ITEMS.sunsetCruise;

  // Fetch the item's param definitions directly
  useEffect(() => {
    async function fetchParamDefs() {
      try {
        if (!state.selectedItemId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/items/${state.selectedItemId}`);
        if (!res.ok) throw new Error("Failed to load activity details");
        const data = await res.json();
        const item = data.item as CheckfrontItem | undefined;

        if (item?.param) {
          const visible: Record<string, BookingParam> = {};
          for (const [key, param] of Object.entries(item.param)) {
            if (isVisibleParam(param)) {
              visible[key] = param;
            }
          }
          setParamDefs(visible);

          // Initialize params with minimum values if not already set
          const initial: Record<string, number> = { ...state.params };
          for (const [key, param] of Object.entries(visible)) {
            if (initial[key] === undefined) {
              initial[key] = param.MIN || (param.req ? 1 : 0);
            }
          }
          setParams(initial);
        } else {
          // Fallback: generic guests param
          setParamDefs({
            guests: {
              lbl: "Guests",
              price: 0,
              qty: 1,
              req: 1,
              MIN: 1,
              MAX: 20,
            },
          });
          if (!params.guests) {
            setParams({ guests: 1 });
          }
        }
      } catch (err) {
        // Fallback to basic guests param
        setParamDefs({
          guests: {
            lbl: "Guests",
            price: 0,
            qty: 1,
            req: 1,
            MIN: 1,
            MAX: 20,
          },
        });
        if (!params.guests) {
          setParams({ guests: 1 });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchParamDefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedItemId]);

  function adjustParam(key: string, delta: number) {
    const def = paramDefs[key];
    if (!def) return;
    const min = def.MIN || 0;
    const max = def.MAX || 99;
    const current = params[key] || min;
    const next = Math.max(min, Math.min(max, current + delta));
    setParams((prev) => ({ ...prev, [key]: next }));
  }

  function getTotalGuests(): number {
    return Object.values(params).reduce((sum, val) => sum + val, 0);
  }

  function handleNext() {
    setError(null);

    // Business rule: Sunset cruise minimum 8 guests
    if (isSunsetCruise && getTotalGuests() < 8) {
      setError(
        "Sunset cruises require a minimum of 8 guests. If you have fewer than 8, " +
        "please contact us to join an existing group or book a private cruise (pay for 8 at $400 total). " +
        "WhatsApp: +599-416-2246",
      );
      return;
    }

    updateState({
      params,
      // Reset rated data when params change
      ratedItem: null,
      selectedSlip: null,
      sessionId: null,
    });
    onNext();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const paramEntries = Object.entries(paramDefs);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">How many in your group?</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          Set the group size for {activityName}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {paramEntries.map(([key, def]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4"
          >
            <div>
              <span className="font-medium">{def.lbl}</span>
              {def.price > 0 && (
                <span className="ml-2 text-sm text-[var(--color-muted)]">
                  (${def.price} each)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                onClick={() => adjustParam(key, -1)}
                disabled={(params[key] || 0) <= (def.MIN || 0)}
                aria-label={`Decrease ${def.lbl}`}
              >
                -
              </button>
              <span className="w-8 text-center text-lg font-semibold">
                {params[key] || 0}
              </span>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                onClick={() => adjustParam(key, 1)}
                disabled={(params[key] || 0) >= (def.MAX || 99)}
                aria-label={`Increase ${def.lbl}`}
              >
                +
              </button>
            </div>
          </div>
        ))}

        {paramEntries.length === 0 && (
          <p className="text-[var(--color-muted)]">
            No additional parameters needed. You can proceed to review pricing.
          </p>
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
