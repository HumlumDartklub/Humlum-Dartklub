"use client";

/* [HELP:NAV:IMPORTS] START */
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
/* [HELP:NAV:IMPORTS] END */

export default function NavBar() {
  /* [HELP:NAV:STATE] START — mobilmenu toggle */
  const [open, setOpen] = useState(false);
  /* [HELP:NAV:STATE] END */

  /* [HELP:NAV:LABELS] START — labels (ingen WIP-badges på HP) */
  const academyLabel = "Humlum Dart Academy";
  const arcadeLabel = "Konkurrencer 🎯";
  /* [HELP:NAV:LABELS] END */

  // [HELP:NAV:RENDER] START — header + nav
  return (
    <header className="w-full">
      <nav className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8 max-w-7xl">
        {/* [HELP:NAV:BRAND] START — logo/brand (link til forside) */}
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-90"
          aria-label="Gå til forsiden"
        >
          <div className="relative h-14 w-14 sm:h-20 sm:w-20">
            <Image
              src="/images/logo/humlum-logo.png"
              alt="Humlum Dartklub logo"
              fill
              sizes="(min-width: 1024px) 5rem, (min-width: 640px) 4rem, 3.5rem"
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>

          {/* Mobil: vis navn + tagline (tidligere skjult) */}
          <span className="text-sm font-semibold leading-tight sm:text-base">
            Humlum Dartklub
            <span className="block text-xs font-normal text-neutral-500">
              Fællesskab &amp; Præcision
            </span>
          </span>
        </Link>
        {/* [HELP:NAV:BRAND] END */}

        {/* [HELP:NAV:DESKTOP] START — desktop-links + CTA */}
        <div className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/">Forside</Link>
          <Link href="/om">Om klubben</Link>
          <Link href="/sponsor">Sponsor</Link>
          <Link href="/sponsorvaeg">Sponsorvæg</Link>
          <Link href="/events">Events</Link>
          <Link href="/academy">{academyLabel}</Link>

          {/* [HELP:NAV:ARCADE:DESKTOP] START */}
          <Link href="/konkurrencer">{arcadeLabel}</Link>
          {/* [HELP:NAV:ARCADE:DESKTOP] END */}

          <Link
            href="/admin/login"
            className="text-xs text-neutral-500 hover:text-neutral-900"
          >
            Bestyrelseslogin
          </Link>

          {/* [HELP:NAV:CTA:DESKTOP] START */}
          <Link href="/bliv-medlem" className="btn btn-primary">
            Bliv medlem
          </Link>
          {/* [HELP:NAV:CTA:DESKTOP] END */}
        </div>
        {/* [HELP:NAV:DESKTOP] END */}

        {/* [HELP:NAV:MOBILE:BUTTON] START — mobil menu-knap */}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm hover:bg-gray-50 md:hidden"
          aria-expanded={open ? "true" : "false"}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* [HELP:NAV:MOBILE:BUTTON] END */}
      </nav>

      {/* [HELP:NAV:MOBILE:PANEL] START — mobil dropdown-panel */}
      <div id="mobile-menu" className={`md:hidden ${open ? "block" : "hidden"}`}>
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex flex-col divide-y">
              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/"
                onClick={() => setOpen(false)}
              >
                Forside
              </Link>

              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/om"
                onClick={() => setOpen(false)}
              >
                Om klubben
              </Link>

              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/sponsor"
                onClick={() => setOpen(false)}
              >
                Sponsor
              </Link>

              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/sponsorvaeg"
                onClick={() => setOpen(false)}
              >
                Sponsorvæg
              </Link>

              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/events"
                onClick={() => setOpen(false)}
              >
                Events
              </Link>

              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/academy"
                onClick={() => setOpen(false)}
              >
                {academyLabel}
              </Link>

              {/* [HELP:NAV:ARCADE:MOBILE] START */}
              <Link
                className="px-4 py-3 hover:bg-gray-50"
                href="/konkurrencer"
                onClick={() => setOpen(false)}
              >
                {arcadeLabel}
              </Link>
              {/* [HELP:NAV:ARCADE:MOBILE] END */}

              <Link
                className="px-4 py-3 text-xs text-neutral-500 hover:bg-gray-50"
                href="/admin/login"
                onClick={() => setOpen(false)}
              >
                Bestyrelseslogin
              </Link>

              {/* [HELP:NAV:CTA:MOBILE] START */}
              <Link
                className="m-3 w-full btn btn-primary justify-center"
                href="/bliv-medlem"
                onClick={() => setOpen(false)}
              >
                Bliv medlem
              </Link>
              {/* [HELP:NAV:CTA:MOBILE] END */}
            </div>
          </div>
        </div>
      </div>
      {/* [HELP:NAV:MOBILE:PANEL] END */}
    </header>
  );
  // [HELP:NAV:RENDER] END
}
