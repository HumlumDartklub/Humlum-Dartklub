// app/medlemszone/layout.tsx
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const LOGO_URL = "public/images/logo/humlum-logo.png"; // <-- ret hvis din sti er anderledes

export default function MedlemszoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* [HELP:HDK:WATERMARK] START */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${LOGO_URL})`,
          backgroundSize: "min(720px, 70vw)",
          opacity: 0.06,
          filter: "grayscale(1)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px circle at 20% 10%, rgba(34,197,94,0.08), transparent 60%), radial-gradient(900px circle at 80% 0%, rgba(59,130,246,0.06), transparent 60%)",
        }}
      />
      {/* [HELP:HDK:WATERMARK] END */}

      <div className="mx-auto w-full max-w-6xl px-4 py-4">{children}</div>
    </div>
  );
}
