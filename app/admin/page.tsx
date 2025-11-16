"use client";
/* [HELP:ADMIN:IMPORTS] START */
import Link from "next/link";
import { useEffect, useState } from "react";
/* [HELP:ADMIN:IMPORTS] END */

/* [HELP:ADMIN:UTILS] START */
async function fetchTab(tab: string): Promise<any[]> {
  const res = await fetch(`/api/sheet?tab=${encodeURIComponent(tab)}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GET /api/sheet?tab=${tab} failed (${res.status})`);
  }
  const data: any = await res.json();
  if (data && data.ok === false) {
    throw new Error(data.error || `Sheet ${tab} returned ok=false`);
  }
  if (Array.isArray(data?.items)) {
    return data.items as any[];
  }
  return [];
}

function toUpperYes(value: any): string {
  return String(value ?? "").trim().toUpperCase();
}
/* [HELP:ADMIN:UTILS] END */

/* [HELP:ADMIN:COMPONENT] START */
export default function AdminLanding() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [
          klubinfoRows,
          indmeldingerRows,
          medlemmerRows,
          eventsRows,
          sponsorPakkerRows,
          tickerRows,
          heroRows,
        ] = await Promise.all([
          fetchTab("KLUBINFO"),
          fetchTab("INDMELDINGER"),
          fetchTab("MEDLEMMER"),
          fetchTab("EVENTS"),
          fetchTab("SPONSORPAKKER"),
          fetchTab("TICKER"),
          fetchTab("HERO"),
        ]);

        if (cancelled) return;

        const klubinfo = klubinfoRows[0] ?? {};

        const totalIndmeldinger = indmeldingerRows.length;
        const pendingIndmeldinger = indmeldingerRows.filter(
          (r) => toUpperYes(r.status) !== "PAID"
        ).length;

        const aktiveMedlemmer = medlemmerRows.filter(
          (r) => toUpperYes(r.status) === "ACTIVE"
        ).length;

        const synligeEvents = eventsRows.filter(
          (r) => toUpperYes(r.visible) === "YES"
        ).length;

        const synligeSponsorPakker = sponsorPakkerRows.filter(
          (r) => toUpperYes(r.visible) === "YES"
        ).length;

        const synligeTicker = tickerRows.filter(
          (r) => toUpperYes(r.visible) === "YES"
        ).length;

        const synligeHero = heroRows.filter(
          (r) => toUpperYes(r.visible) === "YES"
        ).length;

        setStats({
          klubinfo,
          indmeldinger: {
            total: totalIndmeldinger,
            pending: pendingIndmeldinger,
          },
          medlemmer: {
            aktive: aktiveMedlemmer,
          },
          events: {
            synlige: synligeEvents,
          },
          sponsorPakker: {
            synlige: synligeSponsorPakker,
          },
          ticker: {
            synlige: synligeTicker,
          },
          hero: {
            synlige: synligeHero,
          },
        });
      } catch (err: any) {
        console.error("Fejl i admin-dashboard", err);
        if (!cancelled) {
          setError(err?.message || "Ukendt fejl ved indlæsning af data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const klubinfo = stats?.klubinfo ?? {};

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Humlum Admin</h1>
        <p className="text-sm text-neutral-600">
          V3 – Læser data fra HDK_Admin_v3 (read-only i dette trin).
        </p>
        <p className="text-xs text-neutral-500">
          Henter overblik fra Google Sheet…
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Fejl ved indlæsning af admin-data: {error}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Overblik
        </h2>
        {loading && (
          <div className="text-sm text-neutral-500">Loader nøgletal…</div>
        )}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <div className="text-xs uppercase text-neutral-500">
                Nye indmeldinger
              </div>
              <div className="text-lg font-semibold">
                {stats?.indmeldinger?.pending ?? "—"}
              </div>
              <div className="text-xs text-neutral-500">
                I alt: {stats?.indmeldinger?.total ?? "—"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-neutral-500">
                Medlemmer (aktive)
              </div>
              <div className="text-lg font-semibold">
                {stats?.medlemmer?.aktive ?? "—"}
              </div>
              <div className="text-xs text-neutral-500">Total —</div>
            </div>

            <div>
              <div className="text-xs uppercase text-neutral-500">
                Events
              </div>
              <div className="text-lg font-semibold">
                {stats?.events?.synlige ?? "—"}
              </div>
              <div className="text-xs text-neutral-500">
                Synlige i EVENTS
              </div>
            </div>

            <div>
              <div className="text-xs uppercase text-neutral-500">
                Sponsor-pakker
              </div>
              <div className="text-lg font-semibold">
                {stats?.sponsorPakker?.synlige ?? "—"}
              </div>
              <div className="text-xs text-neutral-500">
                Ticker & nyheder: {stats?.ticker?.synlige ?? "—"}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          KLUBINFO (READ-ONLY)
        </h2>
        <div className="flex flex-col gap-2 text-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div>
              <span className="text-xs uppercase text-neutral-500">Navn</span>
              <div className="font-medium">
                {klubinfo.navn || "Humlum Dartklub"}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase text-neutral-500">Email</span>
              <div>{klubinfo.email || "—"}</div>
            </div>
            <div>
              <span className="text-xs uppercase text-neutral-500">
                Telefon
              </span>
              <div>{klubinfo.telefon || "—"}</div>
            </div>
          </div>
          <div className="text-right text-xs text-neutral-500">
            Data hentes direkte fra fanen &quot;Klubinfo&quot; i
            HDK_Admin_v3. Redigering kommer i et senere trin.
          </div>
        </div>
      </section>

      {/* [HELP:ADMIN:NAVIGATION] START */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/admin/indmeldinger"
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Indmeldinger</div>
              <div className="text-sm opacity-70">
                Se nye tilmeldinger (read-only i TRIN 1)
              </div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </Link>

        <Link
          href="/admin/medlemmer"
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Medlemsliste</div>
              <div className="text-sm opacity-70">
                Overblik over medlemmer (MEDLEMMER v3)
              </div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </Link>

        <Link
          href="/admin/pakker"
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Pakker & priser</div>
              <div className="text-sm opacity-70">
                MEDLEMSPAKKER / SPONSORPAKKER via HDK_Admin_v3
              </div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </Link>

        <div className="pointer-events-none rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Filer (MEDIA)</div>
              <div className="text-sm opacity-70">
                Upload/valg af billeder i senere trin
              </div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </div>

        {/* NY: Ticker & Nyheder ER KLIKKBAR */}
        <Link
          href="/admin/ticker"
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Ticker & Nyheder</div>
              <div className="text-sm opacity-70">
                Hurtig redigering styret af TICKER/NYHEDER
              </div>
            </div>
            <div aria-hidden className="text-xl">›</div>
          </div>
        </Link>
      </div>
      {/* [HELP:ADMIN:NAVIGATION] END */}

      <footer className="mt-6 text-center text-xs opacity-70">
        HP røres ikke. Denne side læser kun fra HDK_Admin_v3. Skriv “BYG ADMIN V3 – TRIN
        2” når vi skal videre til indmeldingslisten.
      </footer>
    </main>
  );
}
/* [HELP:ADMIN:COMPONENT] END */
