"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SessionTimerProps {
  sessionId: string | null;
  onExtend?: () => void;
}

export function SessionTimer({ sessionId, onExtend }: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60); // 30 minutes in seconds
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setTimeRemaining(30 * 60);
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Show warning when 5 minutes or less remaining
        if (newTime <= 5 * 60 && newTime > 0) {
          setShowWarning(true);
        }
        
        // Session expired
        if (newTime <= 0) {
          setShowWarning(false);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sessionId || timeRemaining <= 0) return null;

  if (showWarning) {
    return (
      <div className="rounded-lg border-2 border-(--color-warning) bg-(--color-warning-light) p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-(--color-warning)">
              ⏰ Session Expiring Soon
            </p>
            <p className="mt-1 text-sm text-(--color-muted)">
              Your booking session will expire in <strong>{formatTime(timeRemaining)}</strong>.
              Complete your booking or your cart will be cleared.
            </p>
          </div>
          {onExtend && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onExtend}
            >
              Extend Session
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
