"use client";

import { useEffect, useState } from "react";
import type { StepProps } from "@/app/guided/page";
import type { CheckfrontCategory } from "@/lib/checkfront-types";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toArray } from "@/lib/utils";

export function StepCategory({ state, updateState, onNext }: StepProps) {
  const [categories, setCategories] = useState<CheckfrontCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(toArray(data.category || {}));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-[var(--color-error)]">{error}</div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">What would you like to do?</h2>
        <p className="mt-1 text-[var(--color-muted)]">Select a category to browse available activities</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat) => (
          <Card
            key={cat.category_id}
            selected={state.categoryId === cat.category_id}
            hoverable
            onClick={() =>
              updateState({
                categoryId: cat.category_id,
                categoryName: cat.name,
              })
            }
          >
            {cat.image_url && (
              <img
                src={cat.image_url}
                alt={cat.name}
                className="mb-3 h-32 w-full rounded-lg object-cover"
              />
            )}
            <CardTitle>{cat.name}</CardTitle>
            <CardContent>
              {cat.description && (
                <p className="text-sm text-[var(--color-muted)]">{cat.description}</p>
              )}
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {cat.qty} {cat.qty === 1 ? "activity" : "activities"} available
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.categoryId && (
        <div className="flex justify-end">
          <Button onClick={onNext}>Next: Pick Dates</Button>
        </div>
      )}
    </div>
  );
}
