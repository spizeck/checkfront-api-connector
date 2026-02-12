"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { BookingSessionData } from "@/lib/checkfront-types";
import { BookingSummary } from "@/components/guided/booking-summary";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export function StepReview({ state, onNext, session: sessionApi }: StepProps) {
  const [sessionData, setSessionData] = useState<BookingSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const result = await sessionApi.getSession();
      if (result) {
        setSessionData(result.booking.session);
      }
      setLoading(false);
    }
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--color-error)]">
          Session expired or not found. Please go back and select an activity again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Review Your Booking</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          Please confirm the details below before proceeding
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="mb-2 font-semibold">Activity Details</h3>
          <div className="grid gap-2 text-sm">
            {state.categoryName && (
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Category</span>
                <span>{state.categoryName}</span>
              </div>
            )}
            {state.startDate && (
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">Start Date</span>
                <span>
                  {state.startDate.slice(0, 4)}-{state.startDate.slice(4, 6)}-{state.startDate.slice(6, 8)}
                </span>
              </div>
            )}
            {state.endDate && (
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">End Date</span>
                <span>
                  {state.endDate.slice(0, 4)}-{state.endDate.slice(4, 6)}-{state.endDate.slice(6, 8)}
                </span>
              </div>
            )}
            {Object.entries(state.params).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize text-[var(--color-muted)]">{key}</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <BookingSummary session={sessionData} />
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Next: Your Details</Button>
      </div>
    </div>
  );
}
