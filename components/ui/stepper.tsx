import { BOOKING_STEPS, type BookingStep } from "@/lib/constants";

const STEP_LABELS: Record<BookingStep, string> = {
  category: "Category",
  dates: "Dates",
  params: "Guests",
  items: "Activity",
  review: "Review",
  customer: "Details",
  confirm: "Confirm",
};

interface StepperProps {
  currentStep: BookingStep;
}

export function Stepper({ currentStep }: StepperProps) {
  const currentIndex = BOOKING_STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Booking progress">
      <ol className="flex items-center gap-2">
        {BOOKING_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    isCompleted
                      ? "bg-[var(--color-success)] text-white"
                      : isCurrent
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? "\u2713" : index + 1}
                </div>
                <span
                  className={`mt-1 hidden text-xs sm:block ${
                    isCurrent ? "font-medium" : "text-[var(--color-muted)]"
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>
              {index < BOOKING_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 sm:w-10 ${
                    index < currentIndex
                      ? "bg-[var(--color-success)]"
                      : "bg-[var(--color-border)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
