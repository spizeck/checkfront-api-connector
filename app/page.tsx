import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Book Your Adventure
        </h1>
        <p className="mt-4 text-lg text-[var(--color-muted)]">
          Choose how you&apos;d like to find and book your next experience
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Link
          href="/guided"
          className="group rounded-xl border border-[var(--color-border)] p-8 transition-all hover:border-[var(--color-primary)] hover:shadow-lg"
        >
          <div className="mb-4 text-4xl">📋</div>
          <h2 className="text-xl font-semibold group-hover:text-[var(--color-primary)]">
            Guided Booking
          </h2>
          <p className="mt-2 text-[var(--color-muted)]">
            Step-by-step form to browse activities, pick dates, and complete
            your booking
          </p>
        </Link>

        <Link
          href="/chat"
          className="group rounded-xl border border-[var(--color-border)] p-8 transition-all hover:border-[var(--color-primary)] hover:shadow-lg"
        >
          <div className="mb-4 text-4xl">💬</div>
          <h2 className="text-xl font-semibold group-hover:text-[var(--color-primary)]">
            AI Assistant
          </h2>
          <p className="mt-2 text-[var(--color-muted)]">
            Chat with our AI booking assistant to find the perfect experience
          </p>
        </Link>
      </div>
    </div>
  );
}
