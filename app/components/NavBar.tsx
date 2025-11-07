"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const items = [
    { href: "/", label: "Forside" },
    { href: "/om", label: "Om klubben" },
    { href: "/bliv-medlem", label: "Bliv medlem" },
    { href: "/sponsor", label: "Sponsor" },
    { href: "/events", label: "Events" },
    { href: "/academy", label: "Humlum Dart Academy" },
  ];

  return (
    <header className="w-full border-b border-white/10 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold hover:opacity-80 transition">
          Humlum Dartklub
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="hover:opacity-80 transition">
              {i.label}
            </Link>
          ))}
          {/* CTA “Bliv medlem” — nu samme mørkegrønne stil som alle andre knapper */}
          <Link href="/bliv-medlem" className="btn btn-primary">
            Bliv medlem
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden rounded-lg border px-3 py-1 text-sm hover:opacity-80"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          Menu
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" className="md:hidden border-t border-white/10 bg-white/90 backdrop-blur">
          <div className="px-4 py-3 flex flex-col gap-3">
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="py-1 hover:opacity-80 transition"
                onClick={() => setOpen(false)}
              >
                {i.label}
              </Link>
            ))}
            <Link href="/bliv-medlem" className="btn btn-primary" onClick={() => setOpen(false)}>
              Bliv medlem
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
