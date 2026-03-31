"use client";

/* [HELP:ADMIN:LAYOUT:IMPORTS] START */
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
/* [HELP:ADMIN:LAYOUT:IMPORTS] END */

/* [HELP:ADMIN:LAYOUT:CONFIG] START */
const ADMIN_LINKS = [
  { href: "/admin", label: "Overblik" },
  { href: "/admin/galleri", label: "Galleri" },
  { href: "/admin/indmeldinger", label: "Indmeldinger" },
  { href: "/admin/medlemmer", label: "Medlemmer" },
  { href: "/admin/ticker", label: "Ticker & nyheder" },
  { href: "/admin/pakker", label: "Pakker" },
  { href: "/admin/konkurrencer", label: "Konkurrencer" },
  { href: "/admin/kasserer-dashboard", label: "Kasserer" },
] as const;

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Admin-forside",
  "/admin/galleri": "Galleri",
  "/admin/indmeldinger": "Indmeldinger",
  "/admin/medlemmer": "Medlemmer",
  "/admin/ticker": "Ticker & nyheder",
  "/admin/pakker": "Pakker",
  "/admin/konkurrencer": "Konkurrencer",
  "/admin/kasserer-dashboard": "Kasserer-dashboard",
  "/admin/login": "Bestyrelseslogin",
};
/* [HELP:ADMIN:LAYOUT:CONFIG] END */

/* [HELP:ADMIN:LAYOUT:UTILS] START */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function prettifySegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCurrentTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "admin";
  return prettifySegment(last);
}
/* [HELP:ADMIN:LAYOUT:UTILS] END */

/* [HELP:ADMIN:LAYOUT:COMPONENT] START */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const currentTitle = getCurrentTitle(pathname);
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.14),_transparent_28%),linear-gradient(90deg,rgba(255,247,237,0.9),rgba(239,246,255,0.85))]">
      <div className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Humlum Dartklub · Admin
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {currentTitle}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
              >
                ← Hjemmeside
              </Link>
              {pathname !== "/admin" ? (
                <Link
                  href="/admin"
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
                >
                  Admin-forside
                </Link>
              ) : null}
            </div>
          </div>

          {!isLoginPage ? (
            <div className="flex flex-wrap gap-2">
              {ADMIN_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                      (active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50")
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-neutral-500">
              Log ind for at åbne admin-funktionerne.
            </div>
          )}
        </div>
      </div>

      <div className="pb-8">{children}</div>
    </div>
  );
}
/* [HELP:ADMIN:LAYOUT:COMPONENT] END */