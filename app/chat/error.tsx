"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-error-light)">
        <span className="text-2xl text-(--color-error)">!</span>
      </div>
      <h2 className="text-2xl font-bold">Chat Error</h2>
      <p className="max-w-md text-(--color-muted)">
        The AI assistant encountered an error. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
