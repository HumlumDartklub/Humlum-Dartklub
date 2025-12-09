"use client";

/* [HELP:SPWALL:FILE] START — Sponsorvæg: hero + dropdowns + venner */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* [HELP:SPWALL:TYPES] START */
type SponsorTier = "Guld" | "Sølv" | "Bronze";

type Sponsor = {
  id: string;
  name: string;
  tier: SponsorTier;
  url?: string;
  logoUrl?: string;
  featured?: boolean;
  order?: number;
};

type Friend = {
  id: string;
  label: string;
};
/* [HELP:SPWALL:TYPES] END */

/* [HELP:SPWALL:DATA] START — fallback hvis Sheet ikke kan læses */
const FALLBACK_SPONSORS: Sponsor[] = [
  { id: "s1", name: "[Sponsor · plads 1]", tier: "Guld", featured: true },
  { id: "s2", name: "[Sponsor · plads 2]", tier: "Sølv", featured: true },
  { id: "s3", name: "[Sponsor · plads 3]", tier: "Bronze", featured: true },
  { id: "s4", name: "[Sponsor · plads 4]", tier: "Guld" },
  { id: "s5", name: "[Sponsor · plads 5]", tier: "Sølv" },
  { id: "s6", name: "[Sponsor · plads 6]", tier: "Bronze" },
];

const FALLBACK_FRIENDS: Friend[] = [
  { id: "f1", label: "[Familien Jensen · plads]" },
  { id: "f2", label: "[Mette & Morten · plads]" },
  { id: "f3", label: "[Humlum Dart ven · plads]" },
];

const ANONYMOUS_NOTE =
  "Nogle sponsorer og støtter vælger at bidrage anonymt – det respekterer vi selvfølgelig.";
/* [HELP:SPWALL:DATA] END */

/* [HELP:SPWALL:UTILS] START */
function tierClasses(tier: SponsorTier) {
  switch (tier) {
    case "Guld":
      return "border-yellow-300 bg-yellow-50/60";
    case "Sølv":
      return "border-slate-300 bg-slate-50/60";
    case "Bronze":
    default:
      return "border-amber-300 bg-amber-50/60";
  }
}

const isYes = (v: any) =>
  String(v ?? "").trim().toUpperCase() === "YES";

const toNum = (v: any, d = 9999) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

function normalizeTier(v: any): SponsorTier {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.includes("guld") || s.includes("gold")) return "Guld";
  if (s.includes("sølv") || s.includes("solv") || s.includes("silver"))
    return "Sølv";
  return "Bronze";
}
/* [HELP:SPWALL:UTILS] END */

export default function SponsorWallPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(FALLBACK_SPONSORS);
  const [friends] = useState<Friend[]>(FALLBACK_FRIENDS);

  /* [HELP:SPWALL:EFFECTS:LOAD] START — load SPONSORER fra Sheet */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/sheet?tab=SPONSORER&limit=500", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        const rows = Array.isArray(data?.items) ? data.items : [];

        const mapped: Sponsor[] = (rows || [])
          .filter(Boolean)
          .filter((r: any) => {
            const vis = String(r.visible ?? "").trim();
            return !vis || isYes(vis);
          })
          .map((r: any, idx: number) => {
            const id = String(r.id ?? "").trim() || `sp-${idx}`;
            const name = String(r.name ?? r.title ?? "").trim() || "Sponsor";
            const tier = normalizeTier(r.level ?? r.tier);

            const url =
              String(r.website ?? r.url ?? "").trim() || undefined;

            const logoUrl =
              String(r.logo_url ?? r.logoUrl ?? "").trim() || undefined;

            const featured =
              isYes(r.featured) || isYes(r.pin);

            const order = toNum(r.order, 9999);

            return { id, name, tier, url, logoUrl, featured, order };
          })
          .sort((a: Sponsor, b: Sponsor) => (a.order ?? 9999) - (b.order ?? 9999));


        if (!alive) return;
        setSponsors(mapped.length ? mapped : FALLBACK_SPONSORS);
      } catch {
        if (!alive) return;
        setSponsors(FALLBACK_SPONSORS);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  /* [HELP:SPWALL:EFFECTS:LOAD] END */

  const featuredList = useMemo(
    () => sponsors.filter((s) => s.featured),
    [sponsors]
  );

  const mainFeatured = featuredList[0] ?? sponsors[0];
  const extraFeatured = featuredList.slice(1);

  const [showAllSponsors, setShowAllSponsors] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  /* [HELP:SPWALL:RENDER] START */
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* [HELP:SPWALL:HEADER] START — kort intro */}
      <header className="mb-6">
        <div className="rounded-3xl border border-lime-300/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/60 bg-lime-50 px-3 py-1 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            SPONSORVÆG
          </div>

          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            Vores sponsorer og venner
          </h1>

          <p className="mt-2 text-xs text-gray-700 sm:text-sm">
            En hurtig og overskuelig visning af dem, der bakker Humlum Dartklub
            op – både virksomheder og private.
          </p>
        </div>
      </header>
      {/* [HELP:SPWALL:HEADER] END */}

      {/* [HELP:SPWALL:FEATURED] START — “nyheds-agtigt” hero-kort */}
      <section className="mb-8">
        <div className="rounded-3xl border border-lime-300 bg-white p-5 shadow-sm md:flex md:items-stretch md:gap-5">
          <div className="flex flex-1 flex-col">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-lime-500" />
              <span className="uppercase tracking-wide text-gray-700">
                Fremhævet sponsor
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              {mainFeatured?.name || "Fremhævet sponsor · plads"}
            </h2>

            <p className="mt-2 text-xs text-gray-700 sm:text-sm">
              Her kan vi fremhæve én eller flere sponsorer – fx sæsonpartnere
              eller støtte til et særligt event. Logo og link styres via
              admin-arket.
            </p>

            {extraFeatured.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-600">
                {extraFeatured.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-lime-200 bg-lime-50 px-2 py-1"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {mainFeatured?.url && (
                <a
                  href={mainFeatured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                >
                  Besøg sponsor
                </a>
              )}
              <Link
                href="/sponsor"
                className="inline-flex items-center rounded-xl border border-emerald-500/70 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Læs om sponsorpakker
              </Link>
            </div>
          </div>

          <div className="mt-4 md:mt-0 md:w-64">
            <div
              className={`flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed text-[11px] text-gray-600 ${tierClasses(
                mainFeatured?.tier || "Bronze"
              )}`}
            >
              {mainFeatured?.logoUrl ? (
                <img
                  src={mainFeatured.logoUrl}
                  alt={mainFeatured.name}
                  className="max-h-full max-w-full object-contain p-3"
                />
              ) : (
                <>Logo-plads for fremhævet sponsor</>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* [HELP:SPWALL:FEATURED] END */}

      {/* [HELP:SPWALL:ALL-SPONSORS] START — dropdown “Se alle sponsorer” */}
      <section className="mb-8">
        <button
          type="button"
          onClick={() => setShowAllSponsors((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-xs font-semibold text-gray-900 shadow-sm hover:bg-lime-100"
        >
          <span>
            Se alle sponsorer{" "}
            <span className="text-[10px] text-gray-500">
              ({sponsors.length} pladser)
            </span>
          </span>
          <span className="text-[11px] text-gray-600">
            {showAllSponsors ? "Skjul liste ▲" : "Vis liste ▼"}
          </span>
        </button>

        {showAllSponsors && (
          <div className="mt-4 space-y-2">
            {sponsors.map((s) => (
              <SponsorListItem key={s.id} sponsor={s} />
            ))}
          </div>
        )}
      </section>
      {/* [HELP:SPWALL:ALL-SPONSORS] END */}

      {/* [HELP:SPWALL:FRIENDS] START — dropdown til Venner af klubben */}
      <section className="mb-8">
        <button
          type="button"
          onClick={() => setShowFriends((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-900 shadow-sm hover:bg-sky-100"
        >
          <span>
            Se venner af Humlum Dartklub{" "}
            <span className="text-[10px] text-sky-700">
              ({friends.length} eksempler)
            </span>
          </span>
          <span className="text-[11px] text-sky-700">
            {showFriends ? "Skjul liste ▲" : "Vis liste ▼"}
          </span>
        </button>

        {showFriends && (
          <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-sky-900">
              Venner af Humlum Dartklub
            </h2>
            <p className="mt-1 text-xs text-sky-900/80">
              Private støtter, familier og dartvenner uden virksomhed eller
              logo. Navne vises kun, hvis man har sagt ja til det.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-2 text-sky-900 shadow-sm"
                >
                  {f.label}
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-sky-900/70">
              Når du vil, laver vi en dedikeret Sheet-fane til VENNER.
            </p>
          </div>
        )}
      </section>
      {/* [HELP:SPWALL:FRIENDS] END */}

      {/* [HELP:SPWALL:ANON] START — anonyme bidragydere */}
      <section className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-xs text-emerald-900 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold">
          Anonyme sponsorer og støtter
        </h2>
        <p>{ANONYMOUS_NOTE}</p>
      </section>
      {/* [HELP:SPWALL:ANON] END */}

      {/* [HELP:SPWALL:PRIVACY+CTA] START — kun pakkelink, ingen mail-knap */}
      <section className="mt-2 text-xs text-gray-600">
        <p className="mb-3">
          Visning af logo, navn og evt. link sker altid efter aftale og i tråd
          med vores{" "}
          <Link href="/privatliv" className="underline text-emerald-700">
            privatlivspolitik
          </Link>
          .
        </p>

        <div className="mt-2 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="text-gray-700">
            Vil du være sponsor eller støtte klubben?
          </div>
          <Link
            href="/sponsor"
            className="inline-flex items-center rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
          >
            Læs om sponsorpakker
          </Link>
        </div>
      </section>
      {/* [HELP:SPWALL:PRIVACY+CTA] END */}
    </main>
  );
  /* [HELP:SPWALL:RENDER] END */
}

/* [HELP:SPWALL:COMPONENTS] START */

function SponsorListItem({ sponsor }: { sponsor: Sponsor }) {
  return (
    <a
      href={sponsor.url || "#"}
      target={sponsor.url ? "_blank" : undefined}
      rel={sponsor.url ? "noopener noreferrer" : undefined}
      className={`flex items-center gap-3 rounded-2xl border bg-white p-3 text-xs text-gray-800 shadow-sm hover:border-emerald-400 hover:shadow-md ${tierClasses(
        sponsor.tier
      )}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-lime-300 bg-white text-[10px] text-gray-500 overflow-hidden">
        {sponsor.logoUrl ? (
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <>Logo</>
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">
          {sponsor.name}
        </div>
        <div className="mt-1 text-[10px] text-emerald-700 underline">
          {sponsor.url ? "Åbn sponsorens side" : "Link indsættes senere"}
        </div>
      </div>
    </a>
  );
}

/* [HELP:SPWALL:COMPONENTS] END */

/* [HELP:SPWALL:FILE] END */
