export default function GuidedLoading() {
  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Stepper skeleton */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-border)]" />
            {i < 6 && <div className="h-0.5 w-6 bg-[var(--color-border)] sm:w-10" />}
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="h-5 w-96 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-border)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
