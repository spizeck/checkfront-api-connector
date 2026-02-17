"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { CheckfrontItem } from "@/lib/checkfront-types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { stripHtml } from "@/lib/utils";
import {
  formatCfDate,
  inclusiveDaysBetween,
  parseCfDate,
} from "@/lib/date-range";
import { ACTIVITY_INFO, CF_ITEMS, BOOKING_STEPS } from "@/lib/constants";

export function StepReview({ state, updateState, onNext, session }: StepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratedItem, setRatedItem] = useState<CheckfrontItem | null>(
    state.ratedItem,
  );
  const [rentalGearItem, setRentalGearItem] = useState<CheckfrontItem | null>(null);
  const [marineParkFeeItem, setMarineParkFeeItem] = useState<CheckfrontItem | null>(null);
  const [existingSessionData, setExistingSessionData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingItemIndex, setRemovingItemIndex] = useState<number | null>(null);
  const [itemAddedToCart, setItemAddedToCart] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });
  const [addAnotherDialog, setAddAnotherDialog] = useState(false);

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

      try {
        // Fetch existing session data if we have a session ID
        if (state.sessionId) {
          const sessionData = await session.getSession();
          if (sessionData) {
            setExistingSessionData(sessionData.booking.session);
          }
        }

        // Fetch main activity pricing
        let mainItem = state.ratedItem;
        if (!mainItem) {
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

          const item = data.item as CheckfrontItem | undefined;
          if (!item) throw new Error("Activity not found");

          mainItem = item;
          setRatedItem(item);
          updateState({
            ratedItem: item,
            selectedSlip: item.rate?.slip || null,
          });
        } else {
          setRatedItem(mainItem);
        }

        // Fetch rental gear pricing if applicable
        const isDiveActivity = state.selectedItemId && (
          state.selectedItemId === CF_ITEMS.advanced2Tank ||
          state.selectedItemId === CF_ITEMS.classic2Tank ||
          state.selectedItemId === CF_ITEMS.afternoonDive
        );

        if (isDiveActivity && state.rentalGearCount > 0) {
          const rentalParams = new URLSearchParams();
          rentalParams.set("start_date", state.startDate);
          rentalParams.set("end_date", state.endDate);
          rentalParams.set("param.fullrentalgear", String(state.rentalGearCount));

          const rentalRes = await fetch(
            `/api/items/${CF_ITEMS.rentalGear}?${rentalParams.toString()}`,
          );
          
          if (rentalRes.ok) {
            const rentalData = await rentalRes.json();
            setRentalGearItem(rentalData.item);
          }
        }

        // Fetch marine park fee pricing if applicable
        const needsMarineParkFee = state.selectedItemId && (
          state.selectedItemId === CF_ITEMS.advanced2Tank ||
          state.selectedItemId === CF_ITEMS.classic2Tank ||
          state.selectedItemId === CF_ITEMS.afternoonDive ||
          state.selectedItemId === CF_ITEMS.afternoonSnorkel
        );

        if (needsMarineParkFee) {
          const totalGuests = Object.values(state.params).reduce((sum, val) => sum + val, 0);
          
          if (totalGuests > 0) {
            const feeParams = new URLSearchParams();
            feeParams.set("start_date", state.startDate);
            feeParams.set("end_date", state.endDate);
            
            const isSnorkel = state.selectedItemId === CF_ITEMS.afternoonSnorkel;
            const paramKey = isSnorkel ? "snorkeler" : "diver2023rate";
            feeParams.set(`param.${paramKey}`, String(totalGuests));

            const feeRes = await fetch(
              `/api/items/${CF_ITEMS.marineParkFee}?${feeParams.toString()}`,
            );
            
            if (feeRes.ok) {
              const feeData = await feeRes.json();
              setMarineParkFeeItem(feeData.item);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pricing");
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedItemId, state.startDate, state.endDate, state.rentalGearCount]);

  async function addToCart() {
    if (!state.selectedSlip) {
      setError("No booking token available. Please go back and try again.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Add main activity to session
      const result = await session.createSession(
        state.selectedSlip,
        state.sessionId || undefined,
      );
      
      if (!result) {
        setError("Failed to add to cart. Please try again.");
        setSubmitting(false);
        return;
      }

      const sessionId = result.booking.session.id;

      // Step 2: Add rental gear if needed (dive activities only)
      const isDiveActivity = state.selectedItemId && (
        state.selectedItemId === CF_ITEMS.advanced2Tank ||
        state.selectedItemId === CF_ITEMS.classic2Tank ||
        state.selectedItemId === CF_ITEMS.afternoonDive
      );

      if (isDiveActivity && state.rentalGearCount > 0 && state.startDate && state.endDate) {
        const rentalParams = new URLSearchParams();
        rentalParams.set("start_date", state.startDate);
        rentalParams.set("end_date", state.endDate);
        rentalParams.set("param.fullrentalgear", String(state.rentalGearCount));

        const rentalRes = await fetch(
          `/api/items/${CF_ITEMS.rentalGear}?${rentalParams.toString()}`,
        );
        
        if (rentalRes.ok) {
          const rentalData = await rentalRes.json();
          const rentalSlip = rentalData.item?.rate?.slip;
          
          if (rentalSlip) {
            await session.createSession(rentalSlip, sessionId);
          }
        }
      }

      // Step 3: Add marine park fees (dive and snorkel activities only)
      const needsMarineParkFee = state.selectedItemId && (
        state.selectedItemId === CF_ITEMS.advanced2Tank ||
        state.selectedItemId === CF_ITEMS.classic2Tank ||
        state.selectedItemId === CF_ITEMS.afternoonDive ||
        state.selectedItemId === CF_ITEMS.afternoonSnorkel
      );

      if (needsMarineParkFee && state.startDate && state.endDate) {
        // Calculate total divers/snorkelers from params
        const totalGuests = Object.values(state.params).reduce((sum, val) => sum + val, 0);
        
        if (totalGuests > 0) {
          const feeParams = new URLSearchParams();
          feeParams.set("start_date", state.startDate);
          feeParams.set("end_date", state.endDate);
          
          // Use appropriate param based on activity type
          const isSnorkel = state.selectedItemId === CF_ITEMS.afternoonSnorkel;
          const paramKey = isSnorkel ? "snorkeler" : "diver2023rate";
          feeParams.set(`param.${paramKey}`, String(totalGuests));

          const feeRes = await fetch(
            `/api/items/${CF_ITEMS.marineParkFee}?${feeParams.toString()}`,
          );
          
          if (feeRes.ok) {
            const feeData = await feeRes.json();
            const feeSlip = feeData.item?.rate?.slip;
            
            if (feeSlip) {
              await session.createSession(feeSlip, sessionId);
            }
          }
        }
      }

      updateState({ sessionId });
      setItemAddedToCart(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function addToCartAndSelectAnother() {
    if (!state.selectedSlip) return;

    setSubmitting(true);
    setAddAnotherDialog(false);
    
    try {
      const result = await session.createSession(
        state.selectedSlip,
        state.sessionId || undefined,
      );
      
      if (!result) {
        setError("Failed to add to cart. Please try again.");
        setSubmitting(false);
        return;
      }

      const sessionId = result.booking.session.id;

      // Add rental gear if needed
      const isDiveActivity = state.selectedItemId && (
        state.selectedItemId === CF_ITEMS.advanced2Tank ||
        state.selectedItemId === CF_ITEMS.classic2Tank ||
        state.selectedItemId === CF_ITEMS.afternoonDive
      );

      if (isDiveActivity && state.rentalGearCount > 0 && state.startDate && state.endDate) {
        const rentalParams = new URLSearchParams();
        rentalParams.set("start_date", state.startDate);
        rentalParams.set("end_date", state.endDate);
        rentalParams.set("param.fullrentalgear", String(state.rentalGearCount));

        const rentalRes = await fetch(
          `/api/items/${CF_ITEMS.rentalGear}?${rentalParams.toString()}`,
        );
        
        if (rentalRes.ok) {
          const rentalData = await rentalRes.json();
          const rentalSlip = rentalData.item?.rate?.slip;
          
          if (rentalSlip) {
            await session.createSession(rentalSlip, sessionId);
          }
        }
      }

      // Add marine park fees if needed
      const needsMarineParkFee = state.selectedItemId && (
        state.selectedItemId === CF_ITEMS.advanced2Tank ||
        state.selectedItemId === CF_ITEMS.classic2Tank ||
        state.selectedItemId === CF_ITEMS.afternoonDive ||
        state.selectedItemId === CF_ITEMS.afternoonSnorkel
      );

      if (needsMarineParkFee && state.startDate && state.endDate) {
        const totalGuests = Object.values(state.params).reduce((sum, val) => sum + val, 0);
        
        if (totalGuests > 0) {
          const feeParams = new URLSearchParams();
          feeParams.set("start_date", state.startDate);
          feeParams.set("end_date", state.endDate);
          
          const isSnorkel = state.selectedItemId === CF_ITEMS.afternoonSnorkel;
          const paramKey = isSnorkel ? "snorkeler" : "diver2023rate";
          feeParams.set(`param.${paramKey}`, String(totalGuests));

          const feeRes = await fetch(
            `/api/items/${CF_ITEMS.marineParkFee}?${feeParams.toString()}`,
          );
          
          if (feeRes.ok) {
            const feeData = await feeRes.json();
            const feeSlip = feeData.item?.rate?.slip;
            
            if (feeSlip) {
              await session.createSession(feeSlip, sessionId);
            }
          }
        }
      }

      // Reset to activity selection with session preserved
      const activityIndex = BOOKING_STEPS.indexOf("activity");
      updateState({
        sessionId,
        currentStep: activityIndex !== -1 ? BOOKING_STEPS[activityIndex] : state.currentStep,
        selectedItemId: null,
        startDate: null,
        endDate: null,
        params: {},
        ratedItem: null,
        selectedSlip: null,
        rentalGearCount: 0,
        certConfirmed: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add activity");
    } finally {
      setSubmitting(false);
    }
  }

  function skipAndSelectAnother() {
    setAddAnotherDialog(false);
    // Reset to activity selection without adding to cart
    const activityIndex = BOOKING_STEPS.indexOf("activity");
    updateState({
      currentStep: activityIndex !== -1 ? BOOKING_STEPS[activityIndex] : state.currentStep,
      selectedItemId: null,
      startDate: null,
      endDate: null,
      params: {},
      ratedItem: null,
      selectedSlip: null,
      rentalGearCount: 0,
      certConfirmed: false,
    });
  }

  function proceedToDetails() {
    onNext();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Spinner size="lg" />
        <p className="text-sm text-(--color-muted)">
          Checking availability and pricing...
        </p>
      </div>
    );
  }

  if (error && !ratedItem) {
    return (
      <div className="py-12 text-center">
        <p className="text-(--color-error)">{error}</p>
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
        <h2 className="text-2xl font-bold">Review Activity</h2>
        <p className="mt-1 text-(--color-muted)">
          Review the details and pricing below, then add to cart or proceed to checkout
        </p>
      </div>

      {/* Current Activity Being Added */}
      <div className="rounded-lg border border-(--color-border) p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              {activityInfo?.name || ratedItem?.name}
            </h3>
            {ratedItem?.summary && (
              <p className="mt-1 text-sm text-(--color-muted)">
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
              <span className="text-(--color-muted)">
                {numDays === 1 ? "Date" : "Start Date"}
              </span>
              <span>{formatCfDate(state.startDate)}</span>
            </div>
          )}
          {state.endDate && numDays > 1 && (
            <div className="flex justify-between">
              <span className="text-(--color-muted)">End Date</span>
              <span>{formatCfDate(state.endDate)}</span>
            </div>
          )}
          {numDays > 1 && (
            <div className="flex justify-between">
              <span className="text-(--color-muted)">Duration</span>
              <span>{numDays} days</span>
            </div>
          )}
          {Object.entries(state.params).map(([key, val]) => {
            const paramLabel =
              activityInfo?.params.find((p) => p.key === key)?.label || key;
            return (
              <div key={key} className="flex justify-between">
                <span className="text-(--color-muted)">{paramLabel}</span>
                <span>{val}</span>
              </div>
            );
          })}
          {state.rentalGearCount > 0 && (
            <div className="flex justify-between">
              <span className="text-(--color-muted)">
                Full Rental Gear
              </span>
              <span>{state.rentalGearCount}</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        {ratedItem?.rate && !isUnavailable && (
          <div className="mt-4 border-t border-(--color-border) pt-4">
            <div className="space-y-2 text-sm">
              {/* Main activity price */}
              <div className="flex items-baseline justify-between">
                <span className="text-(--color-muted)">
                  {activityInfo?.name || ratedItem.name}
                </span>
                <span className="font-semibold">
                  {ratedItem.rate.summary?.price?.total || "—"}
                </span>
              </div>

              {/* Rental gear price */}
              {rentalGearItem?.rate && (
                <div className="flex items-baseline justify-between">
                  <span className="text-(--color-muted)">
                    Full Rental Gear (×{state.rentalGearCount})
                  </span>
                  <span className="font-semibold">
                    {rentalGearItem.rate.summary?.price?.total || "—"}
                  </span>
                </div>
              )}

              {/* Marine park fee price */}
              {marineParkFeeItem?.rate && (
                <div className="flex items-baseline justify-between">
                  <span className="text-(--color-muted)">
                    Marine Park & Hyperbaric Fees
                  </span>
                  <span className="font-semibold">
                    {marineParkFeeItem.rate.summary?.price?.total || "—"}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mt-3 flex items-baseline justify-between border-t border-(--color-border) pt-3">
              <span className="font-medium">Total Price</span>
              <span className="text-2xl font-bold">
                {(() => {
                  const mainPrice = parseFloat(ratedItem.rate.summary?.price?.total?.replace(/[^0-9.]/g, '') || '0');
                  const rentalPrice = rentalGearItem?.rate?.summary?.price?.total 
                    ? parseFloat(rentalGearItem.rate.summary.price.total.replace(/[^0-9.]/g, '') || '0')
                    : 0;
                  const feePrice = marineParkFeeItem?.rate?.summary?.price?.total
                    ? parseFloat(marineParkFeeItem.rate.summary.price.total.replace(/[^0-9.]/g, '') || '0')
                    : 0;
                  const total = mainPrice + rentalPrice + feePrice;
                  return `$${total.toFixed(2)}`;
                })()}
              </span>
            </div>
          </div>
        )}

        {isUnavailable && (
          <div className="mt-4 border-t border-(--color-border) pt-4">
            <p className="text-sm text-(--color-error)">
              This activity is not available for your selected dates. Please go
              back and choose different dates.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            // Clear current item and go back to activity selection
            setItemAddedToCart(false);
            updateState({
              selectedItemId: null,
              startDate: null,
              endDate: null,
              params: {},
              ratedItem: null,
              selectedSlip: null,
              rentalGearCount: 0,
              certConfirmed: false,
              currentStep: BOOKING_STEPS[0],
            });
          }}
        >
          Clear Current Item
        </Button>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setAddAnotherDialog(true)}
            disabled={submitting || isUnavailable || !state.selectedSlip}
          >
            Add Another Activity
          </Button>

          <Button
            onClick={itemAddedToCart ? proceedToDetails : addToCart}
            disabled={submitting || isUnavailable || !state.selectedSlip}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Adding to cart...
              </span>
            ) : itemAddedToCart ? (
              <span className="flex items-center gap-2">
                ✓ Next: Your Details
              </span>
            ) : (
              "Add to Cart & Continue"
            )}
          </Button>
        </div>
      </div>

      {/* Share Cart Button */}
      {state.sessionId && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const shareUrl = `${window.location.origin}/guided?session=${state.sessionId}`;
              navigator.clipboard.writeText(shareUrl);
              alert('Cart link copied to clipboard! Share this link to resume your booking later.');
            }}
          >
            📋 Save & Share Cart
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Add Another Activity Dialog */}
      {addAnotherDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddAnotherDialog(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-(--color-border) bg-(--color-background) p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Add Activity to Cart?</h3>
            <p className="mt-2 text-sm text-(--color-muted)">
              Would you like to add <strong>{activityInfo?.name || ratedItem?.name}</strong> to your cart before selecting another activity?
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={addToCartAndSelectAnother} disabled={submitting}>
                {submitting ? "Adding..." : "Yes, Add to Cart"}
              </Button>
              <Button variant="secondary" onClick={skipAndSelectAnother} disabled={submitting}>
                No, Skip This Activity
              </Button>
              <Button variant="ghost" onClick={() => setAddAnotherDialog(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
