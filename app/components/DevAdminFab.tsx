"use client";
import Link from "next/link";

/** Dev-only floating button (global) */
export default function DevAdminFab() {
  // vis KUN i development (lokal kørsel)
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      data-dev-admin
      className="fixed z-[999999] pointer-events-auto"
      style={{
        right: "max(env(safe-area-inset-right), 14px)",
        bottom: "max(env(safe-area-inset-bottom), 14px)",
      }}
    >
      <Link
        href="/admin"
        className="grid place-items-center h-12 w-12 rounded-full shadow-lg border border-neutral-300 bg-white text-[11px] font-semibold hover:shadow-xl active:scale-95 transition"
        title="Admin"
        aria-label="Åbn admin"
      >
        Admin
      </Link>
    </div>
  );
}
