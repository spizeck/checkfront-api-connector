"use client";

import { useState } from "react";
import { format, parse, isAfter, isEqual } from "date-fns";
import type { StepProps } from "@/app/guided/page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ACTIVITY_INFO, CF_ITEMS } from "@/lib/constants";
import { inclusiveDaysBetween, parseCfDate } from "@/lib/date-range";

function toInputDate(cfDate: string | null): string {
  if (!cfDate) return "";
  // YYYYMMDD -> YYYY-MM-DD
  return `${cfDate.slice(0, 4)}-${cfDate.slice(4, 6)}-${cfDate.slice(6, 8)}`;
}

function toCfDate(inputDate: string): string {
  // YYYY-MM-DD -> YYYYMMDD
  return inputDate.replace(/-/g, "");
}

export function StepDates({ state, updateState, onNext }: StepProps) {
  const [startDate, setStartDate] = useState(toInputDate(state.startDate));
  const [endDate, setEndDate] = useState(toInputDate(state.endDate));
  const [error, setError] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const activityName = state.selectedItemId
    ? ACTIVITY_INFO[state.selectedItemId]?.name
    : "your activity";

  // Sunset cruise and snorkel are single-day items
  const isSingleDayItem =
    state.selectedItemId === CF_ITEMS.sunsetCruise ||
    state.selectedItemId === CF_ITEMS.afternoonSnorkel ||
    state.selectedItemId === CF_ITEMS.afternoonDive;

  function handleNext() {
    if (!startDate) {
      setError("Please select a start date");
      return;
    }

    // For single-day items, set end = start
    const effectiveEndDate = isSingleDayItem ? startDate : endDate;

    if (!effectiveEndDate) {
      setError("Please select an end date");
      return;
    }

    const start = parse(startDate, "yyyy-MM-dd", new Date());
    const end = parse(effectiveEndDate, "yyyy-MM-dd", new Date());

    if (!isAfter(end, start) && !isEqual(end, start)) {
      setError("End date must be on or after the start date");
      return;
    }

    const cfStart = toCfDate(startDate);
    const cfEnd = toCfDate(effectiveEndDate);
    const numDays = inclusiveDaysBetween(
      parseCfDate(cfStart),
      parseCfDate(cfEnd),
    );

    setError(null);
    updateState({
      startDate: cfStart,
      endDate: cfEnd,
      // Reset rated data when dates change
      ratedItem: null,
      selectedSlip: null,
      sessionId: null,
    });
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">When would you like to go?</h2>
        <p className="mt-1 text-(--color-muted)">
          Select your preferred dates for {activityName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={isSingleDayItem ? "Date" : "Start Date"}
          type="date"
          min={today}
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (isSingleDayItem) {
              setEndDate(e.target.value);
            } else if (endDate && e.target.value > endDate) {
              setEndDate(e.target.value);
            }
          }}
          required
        />
        {!isSingleDayItem && (
          <Input
            label="End Date (inclusive)"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        )}
      </div>

      {!isSingleDayItem && startDate && endDate && (
        <p className="text-sm text-(--color-muted)">
          {(() => {
            try {
              const days = inclusiveDaysBetween(
                parse(startDate, "yyyy-MM-dd", new Date()),
                parse(endDate, "yyyy-MM-dd", new Date()),
              );
              return `${days} day${days === 1 ? "" : "s"} of diving`;
            } catch {
              return "";
            }
          })()}
          {startDate &&
            endDate &&
            (() => {
              try {
                const days = inclusiveDaysBetween(
                  parse(startDate, "yyyy-MM-dd", new Date()),
                  parse(endDate, "yyyy-MM-dd", new Date()),
                );
                if (days >= 2)
                  return " — multi-day discount may apply";
                return "";
              } catch {
                return "";
              }
            })()}
        </p>
      )}

      {error && (
        <p className="text-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!startDate || (!isSingleDayItem && !endDate)}
        >
          Next: Group Size
        </Button>
      </div>
    </div>
  );
}
