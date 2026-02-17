"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CF_ITEMS } from "@/lib/constants";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  onRefresh?: () => void;
}

export function CartModal({ isOpen, onClose, sessionId, onRefresh }: CartModalProps) {
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemName: string;
    onConfirm: () => void;
  }>({ isOpen: false, itemName: "", onConfirm: () => {} });

  useEffect(() => {
    async function fetchCart() {
      if (!sessionId || !isOpen) {
        setCartData(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/session');
        if (response.ok) {
          const data = await response.json();
          setCartData(data.booking.session);
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCart();
  }, [sessionId, isOpen]);

  if (!isOpen) return null;

  const mainActivityIds = [
    CF_ITEMS.advanced2Tank,
    CF_ITEMS.classic2Tank,
    CF_ITEMS.afternoonDive,
    CF_ITEMS.afternoonSnorkel,
    CF_ITEMS.sunsetCruise,
  ];

  const mainActivities = cartData?.item
    ? Object.values(cartData.item).filter((item: any) =>
        mainActivityIds.includes(item.item_id) &&
        parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0') > 0
      )
    : [];

  const handleRemove = async (mainItem: any, index: number) => {
    if (!sessionId || !cartData?.item) return;
    
    setRemovingIndex(index);
    try {
      const itemsArray = Object.values(cartData.item);
      
      // Find associated rental gear and marine park fees
      const associatedItems = itemsArray.filter((item: any) => {
        if (item === mainItem) return false;
        if (item.item_id !== CF_ITEMS.rentalGear && item.item_id !== CF_ITEMS.marineParkFee) return false;
        return item.date?.start_date === mainItem.date?.start_date && 
               item.date?.end_date === mainItem.date?.end_date;
      });

      const rentalGear = associatedItems.find((item: any) => item.item_id === CF_ITEMS.rentalGear) as any;
      const marineParkFee = associatedItems.find((item: any) => item.item_id === CF_ITEMS.marineParkFee) as any;

      const itemsToRemove = [mainItem.slip];
      if (rentalGear) itemsToRemove.push(rentalGear.slip);
      if (marineParkFee) itemsToRemove.push(marineParkFee.slip);
      
      const alterParams: Record<string, string> = {};
      itemsToRemove.forEach(slip => {
        alterParams[slip] = '0';
      });
      
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          alter: alterParams,
        }),
      });
      
      if (response.ok) {
        // Refresh cart data
        const refreshResponse = await fetch('/api/session');
        if (refreshResponse.ok) {
          const sessionData = await refreshResponse.json();
          setCartData(sessionData.booking.session);
        } else {
          // Cart might be empty now
          setCartData(null);
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setRemovingIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border border-(--color-border) bg-(--color-background) p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-(--color-muted)">Loading cart...</div>
        ) : mainActivities.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-(--color-muted)">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {mainActivities.map((mainItem: any, index: number) => {
                // Find associated items
                const itemsArray = Object.values(cartData.item);
                const associatedItems = itemsArray.filter((item: any) => {
                  if (item === mainItem) return false;
                  if (item.item_id !== CF_ITEMS.rentalGear && item.item_id !== CF_ITEMS.marineParkFee) return false;
                  const total = parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0');
                  if (total === 0) return false;
                  return item.date?.start_date === mainItem.date?.start_date && 
                         item.date?.end_date === mainItem.date?.end_date;
                });

                const rentalGear = associatedItems.find((item: any) => item.item_id === CF_ITEMS.rentalGear) as any;
                const marineParkFee = associatedItems.find((item: any) => item.item_id === CF_ITEMS.marineParkFee) as any;

                return (
                  <div
                    key={index}
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              itemName: mainItem.name,
                              onConfirm: () => {
                                setConfirmDialog({ ...confirmDialog, isOpen: false });
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
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="space-y-1 text-sm border-t border-(--color-border) pt-3">
                      <div className="flex justify-between">
                        <span className="text-(--color-muted)">{mainItem.name}</span>
                        <span className="font-semibold">{mainItem.rate.total}</span>
                      </div>
                      {rentalGear && (
                        <div className="flex justify-between">
                          <span className="text-(--color-muted)">{rentalGear.name}</span>
                          <span className="font-semibold">{rentalGear.rate.total}</span>
                        </div>
                      )}
                      {marineParkFee && (
                        <div className="flex justify-between">
                          <span className="text-(--color-muted)">Marine Park & Hyperbaric Fees</span>
                          <span className="font-semibold">{marineParkFee.rate.total}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-(--color-border) font-bold">
                        <span>Item Total</span>
                        <span>
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
            </div>

            <div className="mt-6 pt-4 border-t border-(--color-border) flex justify-between items-baseline">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">{cartData.total}</span>
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
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
