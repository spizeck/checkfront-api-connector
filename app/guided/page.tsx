"use client";

import { useBookingForm, type BookingFormState } from "@/hooks/use-booking-form";
import { useBookingSession } from "@/hooks/use-booking-session";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { StepCategory } from "@/components/guided/step-category";
import { StepDates } from "@/components/guided/step-dates";
import { StepParams } from "@/components/guided/step-params";
import { StepItems } from "@/components/guided/step-items";
import { StepReview } from "@/components/guided/step-review";
import { StepCustomer } from "@/components/guided/step-customer";
import { StepConfirm } from "@/components/guided/step-confirm";
import type { BookingStep } from "@/lib/constants";

export interface StepProps {
  state: BookingFormState;
  updateState: (payload: Partial<BookingFormState>) => void;
  onNext: () => void;
  session: ReturnType<typeof useBookingSession>;
}

const STEP_COMPONENTS: Record<BookingStep, React.ComponentType<StepProps>> = {
  category: StepCategory,
  dates: StepDates,
  params: StepParams,
  items: StepItems,
  review: StepReview,
  customer: StepCustomer,
  confirm: StepConfirm,
};

export default function GuidedBookingPage() {
  const { state, nextStep, prevStep, updateState, isFirstStep, resetForm } =
    useBookingForm();
  const session = useBookingSession();

  const StepComponent = STEP_COMPONENTS[state.currentStep];

  return (
    <div className="flex flex-col gap-8 py-6">
      <Stepper currentStep={state.currentStep} />

      <div className="min-h-[400px]">
        <StepComponent
          state={state}
          updateState={updateState}
          onNext={nextStep}
          session={session}
        />
      </div>

      {state.currentStep !== "confirm" && (
        <div className="flex justify-between border-t border-[var(--color-border)] pt-4">
          {!isFirstStep ? (
            <Button variant="secondary" onClick={prevStep}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={resetForm}>
              Start Over
            </Button>
          )}
          <div />
        </div>
      )}

      {session.error && (
        <div
          className="rounded-lg bg-[var(--color-error-light)] p-3 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {session.error}
        </div>
      )}
    </div>
  );
}
