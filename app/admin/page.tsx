"use client";
import Link from "next/link";

export default function AdminLanding() {
  return (
    <main className="mx-auto max-w-screen-sm p-4">
      <header className="mb-3">
        <h1 className="text-2xl font-bold">Humlum Admin</h1>
        <p className="text-sm opacity-70">
          V1 • Mobilvenlig. Kun “Indmeldinger” er aktiv nu (read-only).
        </p>
      </header>

      {/* Klubinfo (pladsholdere) */}
      <section className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70 mb-2">
          Klubinfo (pladsholdere)
        </h2>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Navn</span><span className="font-medium">Humlum Dartklub</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Email</span><span className="font-medium">—</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Telefon</span><span className="font-medium">—</span>
          </div>
          <div className="flex items-center justify-between">
            <span>CVR</span><span className="font-medium">—</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Adresse</span><span className="font-medium">—</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Postnr.</span><span className="font-medium">—</span>
          </div>
          <div className="flex items-center justify-between">
            <span>By</span><span className="font-medium">Struer</span>
          </div>
        </div>
        <p className="mt-2 text-xs opacity-70">
          Når værdierne er aftalt, kobler vi redigering på. For nu er alt låst.
        </p>
      </section>

      {/* Navigationsfliser */}
      <div className="grid grid-cols-1 gap-3">
        {/* AKTIV – Indmeldinger */}
        <Link
          href="/admin/indmeldinger"
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Indmeldinger</div>
              <div className="text-sm opacity-70">Se nye tilmeldinger (read-only)</div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </Link>

        {/* Deaktiveret – resten kommer senere */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm opacity-60 pointer-events-none">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Medlemsliste</div>
              <div className="text-sm opacity-70">Kommer i STEP 3 (søg/filter)</div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm opacity-60 pointer-events-none">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Filer (MEDIA)</div>
              <div className="text-sm opacity-70">Upload/drag&drop i STEP 4</div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm opacity-60 pointer-events-none">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Ticker & Nyheder</div>
              <div className="text-sm opacity-70">Hurtig redigering i STEP 4</div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </div>
      </div>

      <footer className="mt-6 text-center text-xs opacity-70">
        HP røres ikke. Sig “BYG 3A” når “Marker betalt” skal på.
      </footer>
    </main>
  );
}
