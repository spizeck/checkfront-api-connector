"use client";

import { useState } from "react";
import { format, startOfDay, addMonths } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import type { StepProps } from "@/app/guided/page";
import { Button } from "@/components/ui/button";
import { ACTIVITY_INFO, CF_ITEMS } from "@/lib/constants";
import { inclusiveDaysBetween } from "@/lib/date-range";

function toCfDate(date: Date): string {
  return format(date, "yyyyMMdd");
}

function fromCfDate(cfDate: string | null): Date | undefined {
  if (!cfDate) return undefined;
  const y = Number(cfDate.slice(0, 4));
  const m = Number(cfDate.slice(4, 6)) - 1;
  const d = Number(cfDate.slice(6, 8));
  return new Date(y, m, d);
}

export function StepDates({ state, updateState, onNext }: StepProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    fromCfDate(state.startDate),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    fromCfDate(state.endDate),
  );
  const [error, setError] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const activityName = state.selectedItemId
    ? ACTIVITY_INFO[state.selectedItemId]?.name
    : "your activity";

  // Sunset cruise and snorkel are single-day items
  const isSingleDayItem =
    state.selectedItemId === CF_ITEMS.sunsetCruise ||
    state.selectedItemId === CF_ITEMS.afternoonSnorkel ||
    state.selectedItemId === CF_ITEMS.afternoonDive;

  function handleDayClick(day: Date) {
    if (isSingleDayItem) {
      setStartDate(day);
      setEndDate(day);
      return;
    }

    // Range selection logic
    if (!startDate || (startDate && endDate)) {
      // Start a new range
      setStartDate(day);
      setEndDate(undefined);
    } else {
      // Complete the range
      if (day < startDate) {
        setEndDate(startDate);
        setStartDate(day);
      } else {
        setEndDate(day);
      }
    }
  }

  function handleNext() {
    if (!startDate) {
      setError("Please select a date");
      return;
    }

    const effectiveEnd = isSingleDayItem ? startDate : endDate;
    if (!effectiveEnd) {
      setError("Please select an end date by clicking a second date");
      return;
    }

    setError(null);
    updateState({
      startDate: toCfDate(startDate),
      endDate: toCfDate(effectiveEnd),
      // Reset rated data when dates change
      ratedItem: null,
      selectedSlip: null,
      sessionId: null,
    });
    onNext();
  }

  const numDays =
    startDate && endDate ? inclusiveDaysBetween(startDate, endDate) : 0;

  // Highlight the selected range
  const selectedRange =
    startDate && endDate
      ? { from: startDate, to: endDate }
      : startDate
        ? { from: startDate, to: startDate }
        : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">When would you like to go?</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          {isSingleDayItem
            ? `Pick a date for ${activityName}`
            : `Select your start and end dates for ${activityName}`}
        </p>
      </div>

      <div className="flex justify-center">
        <DayPicker
          mode="range"
          selected={selectedRange}
          onDayClick={handleDayClick}
          disabled={{ before: today }}
          startMonth={today}
          endMonth={addMonths(today, 12)}
          numberOfMonths={2}
          style={{ fontSize: "0.95rem" }}
        />
      </div>

      {/* Selection summary */}
      {startDate && (
        <div className="rounded-lg border border-[var(--color-border)] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-muted)]">
              {isSingleDayItem ? "Date" : "Start Date"}
            </span>
            <span className="font-medium">
              {format(startDate, "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          {!isSingleDayItem && endDate && (
            <>
              <div className="mt-2 flex justify-between">
                <span className="text-[var(--color-muted)]">End Date</span>
                <span className="font-medium">
                  {format(endDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-[var(--color-muted)]">Duration</span>
                <span className="font-medium">
                  {numDays} day{numDays === 1 ? "" : "s"} of diving
                  {numDays === 2 && " — ~5% multi-day discount"}
                  {(numDays === 3 || numDays === 4) &&
                    " — ~10% multi-day discount"}
                  {numDays >= 5 && " — ~15% multi-day discount"}
                </span>
              </div>
            </>
          )}
          {!isSingleDayItem && !endDate && (
            <p className="mt-2 text-[var(--color-muted)]">
              Now click your end date on the calendar
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-[var(--color-error)]" role="alert">
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
