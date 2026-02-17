import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Plan Your Dive
        </h1>
        <p className="mt-4 text-lg text-(--color-muted)">
          Choose how you&apos;d like to explore and book your next experience
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <Link
          href="/guided"
          className="group rounded-xl border border-(--color-border) bg-(--color-surface) p-8 transition-all hover:border-(--color-primary) hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold group-hover:text-(--color-primary)">
            Guided Booking
          </h2>
          <p className="mt-2 text-(--color-muted)">
            Step-by-step form to browse activities, pick dates, and complete
            your booking
          </p>
        </Link>

        <Link
          href="/chat"
          className="group rounded-xl border border-(--color-border) bg-(--color-surface) p-8 transition-all hover:border-(--color-primary) hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold group-hover:text-(--color-primary)">
            Booking Assistant
          </h2>
          <p className="mt-2 text-(--color-muted)">
            Ask questions about our activities, availability, and dive sites
          </p>
        </Link>
      </div>
    </div>
  );
}
