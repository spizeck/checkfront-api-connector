"use client";

import { useState } from "react";
import { format, parse, isAfter, isEqual } from "date-fns";
import type { StepProps } from "@/app/guided/page";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  function handleNext() {
    if (!startDate) {
      setError("Please select a start date");
      return;
    }
    if (!endDate) {
      setError("Please select an end date");
      return;
    }

    const start = parse(startDate, "yyyy-MM-dd", new Date());
    const end = parse(endDate, "yyyy-MM-dd", new Date());

    if (!isAfter(end, start) && !isEqual(end, start)) {
      setError("End date must be on or after the start date");
      return;
    }

    setError(null);
    updateState({
      startDate: toCfDate(startDate),
      endDate: toCfDate(endDate),
    });
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">When would you like to go?</h2>
        <p className="mt-1 text-[var(--color-muted)]">
          Select your preferred dates for {state.categoryName || "your activity"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start Date"
          type="date"
          min={today}
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (endDate && e.target.value > endDate) {
              setEndDate(e.target.value);
            }
          }}
          required
        />
        <Input
          label="End Date"
          type="date"
          min={startDate || today}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!startDate || !endDate}>
          Next: Party Size
        </Button>
      </div>
    </div>
  );
}
