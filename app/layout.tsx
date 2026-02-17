import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "Sea Saba Diving — Booking",
  description: "Book diving, snorkeling, and ocean experiences with Sea Saba on the island of Saba",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} min-h-screen antialiased`}>
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <div className="mx-auto max-w-5xl">
            <a href="/" className="text-xl font-bold text-[var(--color-primary)]">
              {process.env.NEXT_PUBLIC_APP_NAME || "Sea Saba"}
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 text-center text-sm text-[var(--color-muted)]">
          Powered by Checkfront
        </footer>
      </body>
    </html>
  );
}
