"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CartSummaryProps {
  sessionId: string | null;
  onViewCart?: () => void;
}

export function CartSummary({ sessionId, onViewCart }: CartSummaryProps) {
  const [cartData, setCartData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchCart() {
      if (!sessionId) {
        setCartData(null);
        return;
      }

      try {
        const response = await fetch('/api/session');
        if (response.ok) {
          const data = await response.json();
          setCartData(data.booking.session);
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    }

    fetchCart();
  }, [sessionId]);

  if (!cartData || !cartData.item || Object.keys(cartData.item).length === 0) {
    return null;
  }

  const itemCount = Object.values(cartData.item).filter((item: any) => {
    const mainActivityIds = [5, 133, 11, 12, 194]; // CF_ITEMS values
    return mainActivityIds.includes(item.item_id) && 
           parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0') > 0;
  }).length;

  if (itemCount === 0) return null;

  return (
    <div className="sticky top-4 rounded-lg border-2 border-(--color-primary) bg-(--color-primary-light) p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">Your Cart</p>
            <p className="text-xs text-(--color-muted)">
              {itemCount} {itemCount === 1 ? 'activity' : 'activities'}
            </p>
          </div>
          <Badge variant="success">{itemCount}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-(--color-muted)">Total</p>
            <p className="text-lg font-bold">{cartData.total}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 border-t border-(--color-primary) pt-3">
          {Object.values(cartData.item)
            .filter((item: any) => {
              const mainActivityIds = [5, 133, 11, 12, 194];
              return mainActivityIds.includes(item.item_id) && 
                     parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0') > 0;
            })
            .map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-(--color-muted)">{item.name}</span>
                <span className="font-semibold">{item.rate.total}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
