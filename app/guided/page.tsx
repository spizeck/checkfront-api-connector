"use client";

import { useEffect, useState } from "react";
import { useBookingForm, type BookingFormState } from "@/hooks/use-booking-form";
import { useBookingSession } from "@/hooks/use-booking-session";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StepActivity } from "@/components/guided/step-activity";
import { StepDates } from "@/components/guided/step-dates";
import { StepGuests } from "@/components/guided/step-guests";
import { StepReview } from "@/components/guided/step-review";
import { StepDetails } from "@/components/guided/step-customer";
import { StepCheckout } from "@/components/guided/step-confirm";
import { CartModal } from "@/components/guided/cart-modal";
import { SessionTimer } from "@/components/guided/session-timer";
import type { BookingStep } from "@/lib/constants";

export interface StepProps {
  state: BookingFormState;
  updateState: (payload: Partial<BookingFormState>) => void;
  onNext: () => void;
  session: ReturnType<typeof useBookingSession>;
}

const STEP_COMPONENTS: Record<BookingStep, React.ComponentType<StepProps>> = {
  activity: StepActivity,
  dates: StepDates,
  guests: StepGuests,
  review: StepReview,
  details: StepDetails,
  checkout: StepCheckout,
};

export default function GuidedBookingPage() {
  const { state, nextStep, prevStep, updateState, isFirstStep, resetForm } =
    useBookingForm();
  const session = useBookingSession();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState<string>('');

  // Load session from URL parameter if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    if (sessionParam && !state.sessionId) {
      updateState({ sessionId: sessionParam });
    }
  }, []);

  // Fetch cart count and total when session changes
  useEffect(() => {
    async function fetchCartInfo() {
      if (!state.sessionId) {
        setCartCount(0);
        setCartTotal('');
        return;
      }

      try {
        const response = await fetch('/api/session');
        if (response.ok) {
          const data = await response.json();
          const mainActivityIds = [5, 133, 11, 12, 194];
          const count = Object.values(data.booking.session.item || {}).filter(
            (item: any) =>
              mainActivityIds.includes(item.item_id) &&
              parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0') > 0
          ).length;
          setCartCount(count);
          setCartTotal(data.booking.session.total || '');
        }
      } catch (err) {
        // Ignore errors
      }
    }

    fetchCartInfo();
  }, [state.sessionId]);

  const StepComponent = STEP_COMPONENTS[state.currentStep];

  return (
    <div className="guided-embed-light rounded-xl border border-(--color-border) bg-(--color-background) p-6 text-(--color-foreground)">
      <div className="flex flex-col gap-8">
      {/* Cart Button */}
      {state.sessionId && cartCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            🛒 View Cart: {cartTotal}
          </Button>
        </div>
      )}
      
      {/* Session Timer */}
      <SessionTimer sessionId={state.sessionId} />
      
      <Stepper currentStep={state.currentStep} />

      <div className="min-h-400px">
        <StepComponent
          state={state}
          updateState={updateState}
          onNext={nextStep}
          session={session}
        />
      </div>

      {state.currentStep !== "checkout" && (
        <div className="flex justify-between border-t border-(--color-border) pt-4">
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
          className="rounded-lg bg-(--color-error-light) p-3 text-sm text-(--color-error)"
          role="alert"
        >
          {session.error}
        </div>
      )}
      </div>

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        sessionId={state.sessionId}
        onRefresh={() => {
          // Refresh cart count and handle empty cart
          if (state.sessionId) {
            fetch('/api/session')
              .then(res => {
                if (!res.ok) throw new Error('Cart is empty');
                return res.json();
              })
              .then(data => {
                const mainActivityIds = [5, 133, 11, 12, 194];
                const items = data.booking?.session?.item || {};
                const count = Object.values(items).filter(
                  (item: any) =>
                    mainActivityIds.includes(item.item_id) &&
                    parseFloat(item.rate?.total?.replace(/[^0-9.]/g, '') || '0') > 0
                ).length;
                setCartCount(count);
                setCartTotal(data.booking?.session?.total || '');
                
                // If cart is empty, clear session
                if (count === 0) {
                  updateState({ sessionId: null });
                  setIsCartOpen(false);
                }
              })
              .catch(() => {
                // Cart is empty or error occurred
                setCartCount(0);
                setCartTotal('');
                updateState({ sessionId: null });
                setIsCartOpen(false);
              });
          }
        }}
      />
    </div>
  );
}
