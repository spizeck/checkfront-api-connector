"use client";

import { useState, useCallback } from "react";
import type {
  SessionResponse,
  BookingFormResponse,
  BookingCreateResponse,
} from "@/lib/checkfront-types";

interface UseBookingSessionReturn {
  loading: boolean;
  error: string | null;
  createSession: (slip: string | string[], sessionId?: string) => Promise<SessionResponse | null>;
  getSession: () => Promise<SessionResponse | null>;
  clearSession: () => Promise<boolean>;
  getBookingForm: () => Promise<BookingFormResponse | null>;
  createBooking: (form: Record<string, string>, sessionId?: string) => Promise<BookingCreateResponse | null>;
}

export function useBookingSession(): UseBookingSessionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApi = useCallback(
    async <T>(url: string, options?: RequestInit): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Request failed (${response.status})`);
        }
        return (await response.json()) as T;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createSession = useCallback(
    async (slip: string | string[], sessionId?: string) => {
      return fetchApi<SessionResponse>("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slip, session_id: sessionId }),
      });
    },
    [fetchApi],
  );

  const getSession = useCallback(async () => {
    return fetchApi<SessionResponse>("/api/session");
  }, [fetchApi]);

  const clearSession = useCallback(async () => {
    const result = await fetchApi<{ success: boolean }>("/api/session/clear", {
      method: "POST",
    });
    return result?.success ?? false;
  }, [fetchApi]);

  const getBookingForm = useCallback(async () => {
    return fetchApi<BookingFormResponse>("/api/booking/form");
  }, [fetchApi]);

  const createBooking = useCallback(
    async (form: Record<string, string>, sessionId?: string) => {
      return fetchApi<BookingCreateResponse>("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, session_id: sessionId }),
      });
    },
    [fetchApi],
  );

  return {
    loading,
    error,
    createSession,
    getSession,
    clearSession,
    getBookingForm,
    createBooking,
  };
}
