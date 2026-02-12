"use client";

import { useReducer, useCallback } from "react";
import { BOOKING_STEPS, type BookingStep } from "@/lib/constants";
import type { CheckfrontItem } from "@/lib/checkfront-types";

export interface BookingFormState {
  currentStep: BookingStep;
  categoryId: number | null;
  categoryName: string | null;
  startDate: string | null; // YYYYMMDD
  endDate: string | null; // YYYYMMDD
  params: Record<string, number>;
  selectedItem: CheckfrontItem | null;
  selectedSlip: string | null;
  sessionId: string | null;
  customerForm: Record<string, string>;
  invoiceUrl: string | null;
}

type Action =
  | { type: "GO_TO_STEP"; step: BookingStep }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "UPDATE"; payload: Partial<BookingFormState> }
  | { type: "RESET" };

const initialState: BookingFormState = {
  currentStep: "category",
  categoryId: null,
  categoryName: null,
  startDate: null,
  endDate: null,
  params: {},
  selectedItem: null,
  selectedSlip: null,
  sessionId: null,
  customerForm: {},
  invoiceUrl: null,
};

function reducer(state: BookingFormState, action: Action): BookingFormState {
  switch (action.type) {
    case "GO_TO_STEP":
      return { ...state, currentStep: action.step };
    case "NEXT_STEP": {
      const currentIndex = BOOKING_STEPS.indexOf(state.currentStep);
      if (currentIndex < BOOKING_STEPS.length - 1) {
        return { ...state, currentStep: BOOKING_STEPS[currentIndex + 1] };
      }
      return state;
    }
    case "PREV_STEP": {
      const currentIndex = BOOKING_STEPS.indexOf(state.currentStep);
      if (currentIndex > 0) {
        return { ...state, currentStep: BOOKING_STEPS[currentIndex - 1] };
      }
      return state;
    }
    case "UPDATE":
      return { ...state, ...action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useBookingForm() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const goToStep = useCallback(
    (step: BookingStep) => dispatch({ type: "GO_TO_STEP", step }),
    [],
  );
  const nextStep = useCallback(() => dispatch({ type: "NEXT_STEP" }), []);
  const prevStep = useCallback(() => dispatch({ type: "PREV_STEP" }), []);
  const updateState = useCallback(
    (payload: Partial<BookingFormState>) =>
      dispatch({ type: "UPDATE", payload }),
    [],
  );
  const resetForm = useCallback(() => dispatch({ type: "RESET" }), []);

  const currentStepIndex = BOOKING_STEPS.indexOf(state.currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === BOOKING_STEPS.length - 1;

  return {
    state,
    goToStep,
    nextStep,
    prevStep,
    updateState,
    resetForm,
    isFirstStep,
    isLastStep,
  };
}
