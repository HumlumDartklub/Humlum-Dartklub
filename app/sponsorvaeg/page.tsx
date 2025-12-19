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
  name: string;
  note?: string;
  order?: number;
};
/* [HELP:SPWALL:TYPES] END */

/* [HELP:SPWALL:DATA] START — defaults + helpers */
const ANONYMOUS_NOTE =
  "Nogle sponsorer og støtter vælger at bidrage anonymt – det respekterer vi selvfølgelig.";

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
/* [HELP:SPWALL:DATA] END */

export default function SponsorWallPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(true);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);

  const [wallTexts, setWallTexts] = useState<Record<string, string>>({});
  const [textsLoaded, setTextsLoaded] = useState(false);

  const t = (key: string, fallback: string) => {
    // Vis intet, mens vi henter teksterne første gang
    if (!textsLoaded && Object.keys(wallTexts).length === 0) {
      return "";
    }
    return wallTexts[key]?.trim() || fallback;
  };

  /* [HELP:SPWALL:EFFECTS:SPONSORS] START — load SPONSORER fra Sheet */
  useEffect(() => {
    let alive = true;

    (async () => {
      setSponsorsLoading(true);
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
            if (!vis) return true;
            return isYes(vis);
          })
          .map((r: any, idx: number) => {
            const id = String(r.id ?? "").trim() || `sp-${idx}`;
            const name = String(r.name ?? r.title ?? "").trim() || "Sponsor";
            const tier = normalizeTier(r.level ?? r.tier);
            const url =
              String(r.website ?? r.url ?? "").trim() || undefined;
            const logoUrl =
              String(r.logo_url ?? r.logoUrl ?? "").trim() || undefined;
            const featured = isYes(r.featured) || isYes(r.pin);
            const order = toNum(r.order, 9999);
            return { id, name, tier, url, logoUrl, featured, order };
          })
          .sort(
            (a: Sponsor, b: Sponsor) =>
              (a.order ?? 9999) - (b.order ?? 9999)
          );

        if (!alive) return;
        setSponsors(mapped);
      } catch {
        if (!alive) return;
        setSponsors([]);
      } finally {
        if (alive) setSponsorsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  /* [HELP:SPWALL:EFFECTS:SPONSORS] END */

  /* [HELP:SPWALL:EFFECTS:FRIENDS] START — load VENNER fra Sheet */
  useEffect(() => {
    let alive = true;

    (async () => {
      setFriendsLoading(true);
      try {
        const res = await fetch("/api/sheet?tab=VENNER&limit=500", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        const rows = Array.isArray(data?.items) ? data.items : [];

        const mapped: Friend[] = (rows || [])
          .filter(Boolean)
          .map((r: any, idx: number) => {
            const name = String(
              r.name ?? r.label ?? r.title ?? ""
            ).trim();
            if (!name) return null;

            const note = String(r.note ?? r.comment ?? "")
              .trim()
              .replace(/\s+/g, " ");
            const order = toNum(r.order, 9999);
            const id = String(r.id ?? "").trim() || `friend-${idx}`;

            const visibleRaw = String(r.visible ?? "").trim();
            const visible = !visibleRaw || isYes(visibleRaw);
            if (!visible) return null;

            return {
              id,
              name,
              note: note || undefined,
              order,
            };
          })
          .filter((f: Friend | null): f is Friend => !!f)
          .sort(
            (a: Friend, b: Friend) =>
              (a.order ?? 9999) - (b.order ?? 9999)
          );

        if (!alive) return;
        setFriends(mapped);
      } catch {
        if (!alive) return;
        setFriends([]);
      } finally {
        if (alive) setFriendsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  /* [HELP:SPWALL:EFFECTS:FRIENDS] END */

  /* [HELP:SPWALL:EFFECTS:TEXTS] START — load SPONSORVAEG_TEKST */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(
          "/api/sheet?tab=SPONSORVAEG_TEKST&limit=100",
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        const rows = Array.isArray(data?.items) ? data.items : [];

        const map: Record<string, string> = {};
        for (const r of rows || []) {
          if (!r) continue;
          const key = String(r.key ?? r.id ?? "").trim();
          const text = String(
            r.text ?? r.value ?? r.body ?? ""
          ).trim();
          if (!key || !text) continue;
          map[key] = text;
        }

        if (!alive) return;
        setWallTexts(map);
      } catch {
        if (!alive) return;
        setWallTexts({});
      } finally {
        if (alive) setTextsLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  /* [HELP:SPWALL:EFFECTS:TEXTS] END */

  const featuredList = useMemo(
  () => sponsors.filter((s) => s.featured),
  [sponsors]
);

// B: Sponsorvæg viser KUN 1 fremhævet sponsor (laveste order pga sorteringen)
const mainFeatured = featuredList[0] ?? sponsors[0];


  const [showAllSponsors, setShowAllSponsors] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  const featuredTitle = sponsorsLoading
    ? "Henter sponsorer…"
    : mainFeatured
    ? mainFeatured.name
    : "Ingen sponsorer registreret endnu";

  const sponsorsCountLabel = sponsorsLoading
    ? "henter…"
    : `${sponsors.length || 0} pladser`;

  const friendsCountLabel = friendsLoading
    ? "henter…"
    : friends.length === 0
    ? "ingen registreret endnu"
    : friends.length === 1
    ? "1 ven"
    : `${friends.length} venner`;

  /* [HELP:SPWALL:RENDER] START */
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* [HELP:SPWALL:HEADER] START — kort intro */}
      <header className="mb-6">
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-orange-50 px-3 py-1 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            SPONSORVÆG
          </div>

          <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
            Vores sponsorer og venner
          </h1>

          <p className="mt-2 text-xs text-gray-700 sm:text-sm">
            En hurtig og overskuelig visning af dem, der bakker Humlum
            Dartklub op – både virksomheder og private.
          </p>
        </div>
      </header>
      {/* [HELP:SPWALL:HEADER] END */}

      {/* [HELP:SPWALL:FEATURED] START — hero-kort */}
      <section className="mb-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex md:items-stretch md:gap-5">
          <div className="flex flex-1 flex-col">
            <div className="mb-2 inline-flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="uppercase tracking-wide text-gray-700">
                Fremhævet sponsor
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              {featuredTitle}
            </h2>

            <p className="mt-2 text-xs text-gray-700 sm:text-sm">
              {t(
                "featured_intro",
                "Her kan vi fremhæve én eller flere sponsorer – fx sæsonpartnere eller støtte til et særligt event. Logo og link styres via admin-arket."
              )}
            </p>

           
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              {mainFeatured?.url && !sponsorsLoading && (
                <a
                  href={mainFeatured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
                >
                  Besøg sponsor
                </a>
              )}
              <Link
                href="/sponsor"
                className="inline-flex items-center rounded-xl border border-slate-200/70 bg-orange-50 px-4 py-2 font-semibold text-orange-800 hover:bg-orange-50"
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
              {mainFeatured?.logoUrl && !sponsorsLoading ? (
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
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-orange-50 px-4 py-3 text-xs font-semibold text-gray-900 shadow-sm hover:bg-orange-50"
        >
          <span>
            Se alle sponsorer{" "}
            <span className="text-[10px] text-gray-500">
              ({sponsorsCountLabel})
            </span>
          </span>
          <span className="text-[11px] text-gray-600">
            {showAllSponsors ? "Skjul liste ▲" : "Vis liste ▼"}
          </span>
        </button>

        {showAllSponsors && (
          <div className="mt-4 space-y-2">
            {sponsors.length === 0 && !sponsorsLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px] text-gray-700 shadow-sm">
                Der er endnu ikke registreret nogen sponsorer. Vi opdaterer
                siden, så snart de første aftaler er på plads.
              </div>
            )}
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
              ({friendsCountLabel})
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
              {t(
                "friends_intro",
                "Private støtter, familier og dartvenner uden virksomhed eller logo. Navne vises kun, hvis man har sagt ja til det."
              )}
            </p>

            {friends.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                {friends.map((f) => (
                  <div
                    key={f.id}
                    className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-2 text-sky-900 shadow-sm"
                  >
                    <span className="font-medium">{f.name}</span>
                    {f.note && (
                      <span className="ml-1 text-[10px] text-sky-700">
                        – {f.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !friendsLoading && (
                <p className="mt-3 text-[11px] text-sky-900/70">
                  Der er endnu ikke registreret nogen venner i systemet. Vi
                  opdaterer løbende, efterhånden som flere støtter klubben.
                </p>
              )
            )}
          </div>
        )}
      </section>
      {/* [HELP:SPWALL:FRIENDS] END */}

      {/* [HELP:SPWALL:ANON] START — anonyme bidragydere */}
      <section className="mb-6 rounded-3xl border border-slate-200 bg-orange-50/70 p-5 text-xs text-orange-800 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold">
          Anonyme sponsorer og støtter
        </h2>
        <p>{t("anonymous_intro", ANONYMOUS_NOTE)}</p>
      </section>
      {/* [HELP:SPWALL:ANON] END */}

      {/* [HELP:SPWALL:PRIVACY+CTA] START — privatliv + call to action */}
      <section className="mt-2 text-xs text-gray-600">
        <p className="mb-3">
          Visning af logo, navn og evt. link sker altid efter aftale og i
          tråd med vores{" "}
          <Link href="/privatliv" className="underline text-orange-700">
            privatlivspolitik
          </Link>
          .
        </p>

        <div className="mt-2 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="text-gray-700">
            {t(
              "bottom_cta",
              "Vil du være sponsor eller støtte klubben?"
            )}
          </div>
          <Link
            href="/sponsor"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
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
      className={`flex items-center gap-3 rounded-2xl border bg-white p-3 text-xs text-gray-800 shadow-sm hover:border-orange-300 hover:shadow-md ${tierClasses(
        sponsor.tier
      )}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[10px] text-gray-500 overflow-hidden">
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
        <div className="mt-1 text-[10px] text-orange-700 underline">
          {sponsor.url ? "Åbn sponsorens side" : "Link indsættes senere"}
        </div>
      </div>
    </a>
  );
}

/* [HELP:SPWALL:COMPONENTS] END */

/* [HELP:SPWALL:FILE] END */
