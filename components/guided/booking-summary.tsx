"use client";

import type { BookingSessionData } from "@/lib/checkfront-types";
import { toArray } from "@/lib/utils";

interface BookingSummaryProps {
  session: BookingSessionData;
}

export function BookingSummary({ session }: BookingSummaryProps) {
  const items = toArray(session.item || {});

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-6">
      <h3 className="mb-4 text-lg font-semibold">Booking Summary</h3>

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <div
            key={`${item.item_id}-${idx}`}
            className="flex items-center justify-between border-b border-[var(--color-border)] pb-3"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              {item.rate.qty && (
                <p className="text-sm text-(--color-muted)">
                  Qty: {item.rate.qty}
                </p>
              )}
            </div>
            <p className="font-medium">${item.rate.total}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-(--color-muted)">Subtotal</span>
          <span>${session.sub_total}</span>
        </div>
        {parseFloat(session.tax_total) > 0 && (
          <div className="flex justify-between">
            <span className="text-(--color-muted)">Tax</span>
            <span>${session.tax_total}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-(--color-border) pt-2 text-base font-bold">
          <span>Total</span>
          <span>${session.total}</span>
        </div>
      </div>
    </div>
  );
}
