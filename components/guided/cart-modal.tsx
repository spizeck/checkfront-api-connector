"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CF_ITEMS } from "@/lib/constants";

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

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  /** Called after items are removed so parent can refresh header count/total */
  onRefresh?: () => void;
  /** Called when the cart becomes completely empty (all items removed) */
  onCartEmpty?: () => void;
}

export function CartModal({
  isOpen,
  onClose,
  sessionId,
  onRefresh,
  onCartEmpty,
}: CartModalProps) {
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
  }>({ isOpen: false, itemName: "", onConfirm: () => {} });

  // Fetch cart data every time modal opens
  useEffect(() => {
    if (!sessionId || !isOpen) {
      if (!isOpen) setCartData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/session")
      .then((res) => {
        if (!res.ok) throw new Error("No session");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCartData(data.booking?.session ?? null);
      })
      .catch(() => {
        if (!cancelled) setCartData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, isOpen]);

  if (!isOpen) return null;

  // Filter to main activities with a positive total (zeroed-out items stay in
  // the Checkfront response but should not be shown)
  const allItems: any[] = cartData?.item
    ? Object.values(cartData.item)
    : [];

  const mainActivities = allItems.filter(
    (item) =>
      MAIN_ACTIVITY_IDS.includes(item.item_id) &&
      parseMoney(item.rate?.total) > 0,
  );

  // ---- Remove handler ----
  const handleRemove = async (mainItem: any, index: number) => {
    if (!sessionId || !cartData?.item) return;

    setRemovingIndex(index);
    try {
      // Collect SLIPs to zero out: main + associated add-ons (same dates)
      const alter: Record<string, string> = {};

      if (mainItem.slip) alter[mainItem.slip] = "0";

      for (const item of allItems) {
        if (item === mainItem) continue;
        if (
          item.item_id !== CF_ITEMS.rentalGear &&
          item.item_id !== CF_ITEMS.marineParkFee
        )
          continue;
        if (parseMoney(item.rate?.total) === 0) continue;
        // Match by same date range
        if (
          item.date?.start_date === mainItem.date?.start_date &&
          item.date?.end_date === mainItem.date?.end_date &&
          item.slip
        ) {
          alter[item.slip] = "0";
        }
      }

      if (Object.keys(alter).length === 0) {
        console.error("No valid SLIPs to remove");
        setRemovingIndex(null);
        return;
      }

      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, alter }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Failed to remove item:", err);
        alert("Failed to remove item. Please try again.");
        return;
      }

      // Re-fetch the session to get updated state
      const refreshRes = await fetch("/api/session");

      if (!refreshRes.ok) {
        // Session gone entirely — cart is empty
        setCartData(null);
        onRefresh?.();
        onCartEmpty?.();
        return;
      }

      const sessionData = await refreshRes.json();
      const updatedItems: any[] = Object.values(
        sessionData.booking?.session?.item || {},
      );
      const remaining = updatedItems.filter(
        (item) =>
          MAIN_ACTIVITY_IDS.includes(item.item_id) &&
          parseMoney(item.rate?.total) > 0,
      );

      if (remaining.length > 0) {
        setCartData(sessionData.booking.session);
        onRefresh?.();
      } else {
        // Cart is now empty — tell parent to clear session
        setCartData(null);
        onRefresh?.();
        onCartEmpty?.();
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setRemovingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border border-(--color-border) bg-(--color-surface) p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-(--color-muted)">
            Loading cart...
          </div>
        ) : mainActivities.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-(--color-muted)">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {mainActivities.map((mainItem: any, index: number) => {
                // Find associated add-ons by date match
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
                    key={mainItem.slip || index}
                    className="rounded-lg border border-(--color-border) p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold">{mainItem.name}</p>
                        {mainItem.date?.summary && (
                          <p className="text-sm text-(--color-muted) mt-1">
                            {mainItem.date.summary}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            itemName: mainItem.name,
                            onConfirm: () => {
                              setConfirmDialog((d) => ({
                                ...d,
                                isOpen: false,
                              }));
                              handleRemove(mainItem, index);
                            },
                          });
                        }}
                        disabled={removingIndex === index}
                        className="text-(--color-error)"
                      >
                        {removingIndex === index ? "Deleting..." : "Delete"}
                      </Button>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="space-y-1 text-sm border-t border-(--color-border) pt-3">
                      <div className="flex justify-between">
                        <span className="text-(--color-muted)">
                          {mainItem.name}
                        </span>
                        <span className="font-semibold">
                          {mainItem.rate?.total}
                        </span>
                      </div>
                      {rentalGear && (
                        <div className="flex justify-between">
                          <span className="text-(--color-muted)">
                            {rentalGear.name}
                          </span>
                          <span className="font-semibold">
                            {rentalGear.rate?.total}
                          </span>
                        </div>
                      )}
                      {marineParkFee && (
                        <div className="flex justify-between">
                          <span className="text-(--color-muted)">
                            Marine Park & Hyperbaric Fees
                          </span>
                          <span className="font-semibold">
                            {marineParkFee.rate?.total}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-(--color-border) font-bold">
                        <span>Item Total</span>
                        <span>${lineTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-(--color-border) flex justify-between items-baseline">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">{cartData?.total}</span>
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove from Cart?"
        message={`Are you sure you want to remove "${confirmDialog.itemName}" from your cart?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, isOpen: false }))}
      />
    </div>
  );
}
