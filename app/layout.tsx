// app/layout.tsx
import "./globals.css";

import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import LiveTicker from "./components/LiveTicker";

export const metadata: Metadata = {
  title: "Humlum Dartklub",
  description: "Fællesskab & Præcision",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="h-full">
      <body className="h-full flex flex-col bg-[var(--bg)] text-[var(--fg)]">
        {/* NAV + ticker */}
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <NavBar />
          </div>
          <LiveTicker />
        </header>

        {/* Page content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-[var(--fg)] bg-white">
          © {new Date().getFullYear()} Humlum Dartklub · Fællesskab & Præcision
        </footer>
      </body>
    </html>
  );
}
