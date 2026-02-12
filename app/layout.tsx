import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Booking Assistant",
  description: "Book your next adventure with our guided booking tool or AI assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--color-border)] px-6 py-4">
          <div className="mx-auto max-w-5xl">
            <a href="/" className="text-xl font-bold">
              {process.env.NEXT_PUBLIC_APP_NAME || "Booking Assistant"}
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <footer className="border-t border-[var(--color-border)] px-6 py-4 text-center text-sm text-[var(--color-muted)]">
          Powered by Checkfront
        </footer>
      </body>
    </html>
  );
}
