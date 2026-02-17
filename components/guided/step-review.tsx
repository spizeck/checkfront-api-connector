"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { CheckfrontItem } from "@/lib/checkfront-types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  async function handleConfirm() {
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
        setError("Failed to add to booking. Please try again.");
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
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        <h2 className="text-2xl font-bold">Review & Confirm Pricing</h2>
        <p className="mt-1 text-(--color-muted)">
          Verify the details and pricing below, then continue to enter your
          details
        </p>
      </div>

      {/* Existing Session Items */}
      {existingSessionData && Object.keys(existingSessionData.item || {}).length > 0 && (() => {
        // Group items by main activity - each main activity with its associated fees
        const itemsArray = Object.values(existingSessionData.item);
        const mainActivityIds = [
          CF_ITEMS.advanced2Tank,
          CF_ITEMS.classic2Tank,
          CF_ITEMS.afternoonDive,
          CF_ITEMS.afternoonSnorkel,
          CF_ITEMS.sunsetCruise,
        ];

        // Find all main activities
        const mainActivities = itemsArray.filter((item: any) => 
          mainActivityIds.includes(item.item_id) && 
          parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0') > 0
        );

        if (mainActivities.length === 0) return null;

        return (
          <>
            {mainActivities.map((mainItem: any, index: number) => {
              // Find associated rental gear and marine park fees for this activity
              // Match by date range
              const associatedItems = itemsArray.filter((item: any) => {
                if (item === mainItem) return false;
                if (item.item_id !== CF_ITEMS.rentalGear && item.item_id !== CF_ITEMS.marineParkFee) return false;
                
                const total = parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0');
                if (total === 0) return false;
                
                // Match by date range
                return item.date?.start_date === mainItem.date?.start_date && 
                       item.date?.end_date === mainItem.date?.end_date;
              });

              const rentalGear = associatedItems.find((item: any) => item.item_id === CF_ITEMS.rentalGear) as any;
              const marineParkFee = associatedItems.find((item: any) => item.item_id === CF_ITEMS.marineParkFee) as any;

              return (
                <div key={index} className="rounded-lg border border-(--color-border) p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{mainItem.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">In Cart</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!state.sessionId) return;
                          
                          try {
                            // Remove the main item and its associated items from session
                            const itemsToRemove = [mainItem.slip];
                            if (rentalGear) itemsToRemove.push(rentalGear.slip);
                            if (marineParkFee) itemsToRemove.push(marineParkFee.slip);
                            
                            // Alter session to remove items
                            const alterParams: Record<string, string> = {};
                            itemsToRemove.forEach(slip => {
                              alterParams[slip] = '0'; // Setting quantity to 0 removes the item
                            });
                            
                            const response = await fetch('/api/session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                session_id: state.sessionId,
                                alter: alterParams,
                              }),
                            });
                            
                            if (response.ok) {
                              // Refresh the session data
                              const sessionData = await session.getSession();
                              if (sessionData) {
                                setExistingSessionData(sessionData.booking.session);
                              }
                            }
                          } catch (err) {
                            console.error('Failed to remove item:', err);
                          }
                        }}
                        className="text-(--color-error) hover:bg-(--color-error-light)"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    {mainItem.date?.summary && (
                      <div className="flex justify-between">
                        <span className="text-(--color-muted)">Date</span>
                        <span>{mainItem.date.summary}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-(--color-border) pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-baseline justify-between">
                        <span className="text-(--color-muted)">{mainItem.name}</span>
                        <span className="font-semibold">{mainItem.rate.total}</span>
                      </div>

                      {rentalGear && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-(--color-muted)">{rentalGear.name}</span>
                          <span className="font-semibold">{rentalGear.rate.total}</span>
                        </div>
                      )}

                      {marineParkFee && (
                        <div className="flex items-baseline justify-between">
                          <span className="text-(--color-muted)">Marine Park & Hyperbaric Fees</span>
                          <span className="font-semibold">{marineParkFee.rate.total}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-baseline justify-between border-t border-(--color-border) pt-3">
                      <span className="font-medium">Total Price</span>
                      <span className="text-2xl font-bold">
                        {(() => {
                          const mainPrice = parseFloat(mainItem.rate.total.replace(/[^0-9.]/g, '') || '0');
                          const rentalPrice = rentalGear ? parseFloat(rentalGear.rate.total.replace(/[^0-9.]/g, '') || '0') : 0;
                          const feePrice = marineParkFee ? parseFloat(marineParkFee.rate.total.replace(/[^0-9.]/g, '') || '0') : 0;
                          const total = mainPrice + rentalPrice + feePrice;
                          return `$${total.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg border-2 border-(--color-primary) bg-(--color-primary-light) p-5">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold">Cart Subtotal</span>
                <span className="text-2xl font-bold">{existingSessionData.total}</span>
              </div>
            </div>
          </>
        );
      })()}

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
          variant="secondary"
          onClick={async () => {
            // Add current activity to session first
            if (state.selectedSlip) {
              setSubmitting(true);
              try {
                const result = await session.createSession(
                  state.selectedSlip,
                  state.sessionId || undefined,
                );
                
                if (result) {
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
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to add activity");
              } finally {
                setSubmitting(false);
              }
            }
          }}
          disabled={submitting || isUnavailable || !state.selectedSlip}
        >
          Add Another Activity
        </Button>

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
