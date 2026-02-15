"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GuidedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Guided booking error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-error-light)">
        <span className="text-2xl text-(--color-error)">!</span>
      </div>
      <h2 className="text-2xl font-bold">Booking Error</h2>
      <p className="max-w-md text-(--color-muted)">
        Something went wrong with the booking process. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/guided")}>
          Start Over
        </Button>
      </div>
    </div>
  );
}
