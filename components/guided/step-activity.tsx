"use client";

import { useState } from "react";
import type { StepProps } from "@/app/guided/page";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CF_ITEMS, ACTIVITY_INFO } from "@/lib/constants";

const ACTIVITIES = [
  CF_ITEMS.advanced2Tank,
  CF_ITEMS.classic2Tank,
  CF_ITEMS.afternoonDive,
  CF_ITEMS.afternoonSnorkel,
  CF_ITEMS.sunsetCruise,
];

export function StepActivity({ state, updateState, onNext }: StepProps) {
  const [showCertWarning, setShowCertWarning] = useState(false);

  function handleSelect(itemId: number) {
    setShowCertWarning(false);
    updateState({
      selectedItemId: itemId,
      // Reset downstream state when activity changes
      ratedItem: null,
      selectedSlip: null,
      sessionId: null,
      certConfirmed: false,
    });
  }

  // Items that require a certification check before proceeding
  const CERT_ITEMS: Set<number> = new Set([
    CF_ITEMS.advanced2Tank,
    CF_ITEMS.classic2Tank,
    CF_ITEMS.afternoonDive,
  ]);

  function handleNext() {
    if (!state.selectedItemId) return;

    if (CERT_ITEMS.has(state.selectedItemId) && !state.certConfirmed) {
      setShowCertWarning(true);
      return;
    }

    onNext();
  }

  function handleCertConfirm() {
    updateState({ certConfirmed: true });
    setShowCertWarning(false);
    onNext();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">What would you like to do?</h2>
        <p className="mt-1 text-(--color-muted)">
          Choose from our diving, snorkeling, and cruise experiences
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ACTIVITIES.map((itemId) => {
          const info = ACTIVITY_INFO[itemId];
          if (!info) return null;

          return (
            <Card
              key={itemId}
              selected={state.selectedItemId === itemId}
              hoverable
              onClick={() => handleSelect(itemId)}
            >
              <CardTitle>{info.name}</CardTitle>
              <CardContent>
                <p className="mt-1 text-sm text-(--color-muted)">
                  {info.shortDesc}
                </p>
                <p className="mt-2 text-xs font-medium text-(--color-primary)">
                  {info.pickupTime}
                </p>
                {info.certRequired && (
                  <p className="mt-1 text-xs text-(--color-warning)">
                    Requires: {info.certRequired}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Certification Check Modal */}
      {showCertWarning && state.selectedItemId === CF_ITEMS.advanced2Tank && (
        <div className="rounded-lg border-2 border-(--color-warning) bg-(--color-warning-light) p-4">
          <h3 className="font-semibold text-(--color-warning)">
            Certification Check
          </h3>
          <p className="mt-1 text-sm">
            The Advanced 2-Tank Dive visits deep pinnacle sites (80-110+ ft) and
            requires <strong>Advanced Open Water certification with 20+ logged
            dives</strong>, or <strong>Open Water certification with 50+ logged
            dives</strong>.
          </p>
          <p className="mt-2 text-sm">
            Do all divers in your group meet these requirements?
          </p>
          <div className="mt-3 flex gap-3">
            <Button size="sm" onClick={handleCertConfirm}>
              Yes, we qualify
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowCertWarning(false);
                handleSelect(CF_ITEMS.afternoonSnorkel);
              }}
            >
              No &mdash; switch to Snorkeling
            </Button>
          </div>
        </div>
      )}

      {showCertWarning && (state.selectedItemId === CF_ITEMS.classic2Tank || state.selectedItemId === CF_ITEMS.afternoonDive) && (
        <div className="rounded-lg border-2 border-(--color-warning) bg-(--color-warning-light) p-4">
          <h3 className="font-semibold text-(--color-warning)">
            Certification Check
          </h3>
          <p className="mt-1 text-sm">
            {state.selectedItemId === CF_ITEMS.classic2Tank
              ? "The Classic 2-Tank Dive"
              : "The Afternoon 1-Tank Dive"}{" "}
            requires <strong>Open Water certification</strong> (or Scuba Diver
            certification with a private guide).
          </p>
          <p className="mt-2 text-sm">
            Do all divers in your group hold a valid scuba certification?
          </p>
          <div className="mt-3 flex gap-3">
            <Button size="sm" onClick={handleCertConfirm}>
              Yes, we&apos;re certified
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setShowCertWarning(false);
                handleSelect(CF_ITEMS.afternoonSnorkel);
              }}
            >
              No &mdash; switch to Snorkeling
            </Button>
          </div>
        </div>
      )}

      {state.selectedItemId && !showCertWarning && (
        <div className="flex justify-end">
          <Button onClick={handleNext}>Next: Pick Dates</Button>
        </div>
      )}
    </div>
  );
}
