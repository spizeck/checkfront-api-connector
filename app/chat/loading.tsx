export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-200px)] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--color-border)]" />
        <div className="h-6 w-48 animate-pulse rounded bg-[var(--color-border)]" />
        <div className="h-4 w-72 animate-pulse rounded bg-[var(--color-border)]" />
      </div>
      <div className="flex gap-2 border-t border-[var(--color-border)] pt-4">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-[var(--color-border)]" />
        <div className="h-10 w-16 animate-pulse rounded-lg bg-[var(--color-border)]" />
      </div>
    </div>
  );
}
