"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CF_ITEMS, ACTIVITY_INFO } from "@/lib/constants";

const MAIN_ACTIVITY_IDS = [
  CF_ITEMS.advanced2Tank,
  CF_ITEMS.classic2Tank,
  CF_ITEMS.afternoonDive,
  CF_ITEMS.afternoonSnorkel,
  CF_ITEMS.sunsetCruise,
];

/** Parse a dollar string like "$123.45 USD" → 123.45 */
function parseMoney(s: string | undefined | null): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[^0-9.]/g, "") || "0");
}

export function StepCheckout({ state, session }: StepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(state.invoiceUrl);

  // Full session data fetched from the API
  const [sessionData, setSessionData] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Fetch the full session so we can show ALL cart items
  useEffect(() => {
    if (!state.sessionId) {
      setLoadingSession(false);
      return;
    }

    let cancelled = false;
    setLoadingSession(true);

    fetch("/api/session")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load session");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSessionData(data.booking?.session ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [state.sessionId]);

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

  // --- Build cart line items from session data ---
  const allItems: any[] = sessionData?.item
    ? Object.values(sessionData.item)
    : [];

  const mainActivities = allItems.filter(
    (item) =>
      MAIN_ACTIVITY_IDS.includes(item.item_id) &&
      parseMoney(item.rate?.total) > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
        <p className="mt-1 text-(--color-muted)">
          Review everything one last time, then submit to proceed to payment
        </p>
      </div>

      {loadingSession ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ---- Cart Items ---- */}
          {mainActivities.length > 0 ? (
            mainActivities.map((mainItem: any, idx: number) => {
              const info = ACTIVITY_INFO[mainItem.item_id];

              // Associated add-ons by matching date range
              const associated = allItems.filter((item: any) => {
                if (item === mainItem) return false;
                if (
                  item.item_id !== CF_ITEMS.rentalGear &&
                  item.item_id !== CF_ITEMS.marineParkFee
                )
                  return false;
                if (parseMoney(item.rate?.total) === 0) return false;
                return (
                  item.date?.start_date === mainItem.date?.start_date &&
                  item.date?.end_date === mainItem.date?.end_date
                );
              });

              const rentalGear = associated.find(
                (i: any) => i.item_id === CF_ITEMS.rentalGear,
              ) as any;
              const marineParkFee = associated.find(
                (i: any) => i.item_id === CF_ITEMS.marineParkFee,
              ) as any;

              const lineTotal =
                parseMoney(mainItem.rate?.total) +
                parseMoney(rentalGear?.rate?.total) +
                parseMoney(marineParkFee?.rate?.total);

              return (
                <div
                  key={mainItem.slip || idx}
                  className="rounded-lg border border-(--color-border) p-4"
                >
                  <h3 className="mb-1 font-semibold">
                    {info?.name || mainItem.name}
                  </h3>
                  {mainItem.date?.summary && (
                    <p className="text-sm text-(--color-muted)">
                      {mainItem.date.summary}
                    </p>
                  )}

                  {/* Pricing lines */}
                  <div className="mt-3 space-y-1 text-sm border-t border-(--color-border) pt-3">
                    <div className="flex justify-between">
                      <span className="text-(--color-muted)">{mainItem.name}</span>
                      <span className="font-semibold">{mainItem.rate?.total}</span>
                    </div>
                    {rentalGear && (
                      <div className="flex justify-between">
                        <span className="text-(--color-muted)">{rentalGear.name}</span>
                        <span className="font-semibold">{rentalGear.rate?.total}</span>
                      </div>
                    )}
                    {marineParkFee && (
                      <div className="flex justify-between">
                        <span className="text-(--color-muted)">Marine Park & Hyperbaric Fees</span>
                        <span className="font-semibold">{marineParkFee.rate?.total}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-(--color-border) font-bold">
                      <span>Subtotal</span>
                      <span>${lineTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Fallback: show the single ratedItem from state if session fetch failed */
            state.ratedItem && (
              <div className="rounded-lg border border-(--color-border) p-4">
                <h3 className="mb-1 font-semibold">
                  {ACTIVITY_INFO[state.selectedItemId!]?.name || state.ratedItem.name}
                </h3>
                {state.ratedItem.rate && (
                  <p className="mt-2 text-lg font-bold">
                    {state.ratedItem.rate.summary?.price?.total || "Price on request"}
                  </p>
                )}
              </div>
            )
          )}

          {/* Cart total from Checkfront */}
          {sessionData?.total && mainActivities.length > 0 && (
            <div className="flex justify-between items-baseline border-t border-(--color-border) pt-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">{sessionData.total}</span>
            </div>
          )}

          {/* ---- Customer Details ---- */}
          {Object.keys(state.customerForm).length > 0 && (
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
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSubmit} disabled={submitting || loadingSession}>
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
