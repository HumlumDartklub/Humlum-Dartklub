"use client";

/* [HELP:NAV:IMPORTS] START */
import Link from "next/link";
import { useState } from "react";
/* [HELP:NAV:IMPORTS] END */

export default function NavBar() {
  /* [HELP:NAV:STATE] START — mobilmenu toggle */
  const [open, setOpen] = useState(false);
  /* [HELP:NAV:STATE] END */

  // [HELP:NAV:RENDER] START — header + nav
  return (
    <header className="w-full">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* [HELP:NAV:BRAND] START — logo/brand (link til forside) */}
        <Link href="/" className="font-bold hover:opacity-80" aria-label="Gå til forsiden">
          Humlum Dartklub
        </Link>
        {/* [HELP:NAV:BRAND] END */}

        {/* [HELP:NAV:DESKTOP] START — desktop-links + CTA */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/">Forside</Link>
          <Link href="/om">Om klubben</Link>
          <Link href="/sponsor">Sponsor</Link>
          <Link href="/events">Events</Link>
          <Link href="/academy">Humlum Dart Academy</Link>
          <Link
            href="/bliv-medlem"
            className="inline-flex items-center rounded-xl bg-emerald-600 text-white px-3 py-1.5 hover:opacity-90"
          >
            Bliv medlem
          </Link>
        </div>
        {/* [HELP:NAV:DESKTOP] END */}

        {/* [HELP:NAV:MOBILE:BUTTON] START — mobil menu-knap */}
        <button
          type="button"
          className="md:hidden inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm hover:bg-gray-50"
          aria-expanded={open ? "true" : "false"}
          aria-controls="mobile-menu"
          onClick={() => setOpen(v => !v)}
        >
          Menu
          {/* simpelt hamburger-ikon */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {/* [HELP:NAV:MOBILE:BUTTON] END */}
      </nav>

      {/* [HELP:NAV:MOBILE:PANEL] START — mobil dropdown-panel */}
      <div id="mobile-menu" className={`md:hidden ${open ? "block" : "hidden"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-3">
          <div className="rounded-xl border shadow-sm bg-white overflow-hidden">
            <div className="flex flex-col divide-y">
              <Link className="px-4 py-3 hover:bg-gray-50" href="/" onClick={() => setOpen(false)}>Forside</Link>
              <Link className="px-4 py-3 hover:bg-gray-50" href="/om" onClick={() => setOpen(false)}>Om klubben</Link>
              <Link className="px-4 py-3 hover:bg-gray-50" href="/sponsor" onClick={() => setOpen(false)}>Sponsor</Link>
              <Link className="px-4 py-3 hover:bg-gray-50" href="/events" onClick={() => setOpen(false)}>Events</Link>
              <Link className="px-4 py-3 hover:bg-gray-50" href="/academy" onClick={() => setOpen(false)}>Humlum Dart Academy</Link>

              <Link
                href="/bliv-medlem"
                onClick={() => setOpen(false)}
                className="m-3 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white px-3 py-2 hover:opacity-90"
              >
                Bliv medlem
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* [HELP:NAV:MOBILE:PANEL] END */}
    </header>
  );
  // [HELP:NAV:RENDER] END
}
