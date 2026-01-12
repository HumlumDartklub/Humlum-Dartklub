"use client";

/** [HELP:HOME:IMPORTS] START
 * Pitch: Imports til forsiden (HP).
 * [HELP:HOME:IMPORTS] END */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getForsideData } from "../lib/getForsideData";
import type { SheetMap } from "../lib/getForsideData";
import NewsHeroOverlay from "../components/NewsHeroOverlay";
import HeroBackdropSlider from "../components/HeroBackdropSlider";
import SponsorCard from "../components/SponsorCard";
/** [HELP:HOME:IMPORTS] END */

type ViewState = { map: SheetMap; updated?: string };

export default function Page() {
  const [state, setState] = useState<ViewState>({ map: {} as SheetMap });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const data = await getForsideData();
      if (!alive) return;
      setState(data as any);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const d = state.map || ({} as any);

  const klubinfoRows = (d?.KLUBINFO as any[]) || [];
  const klubinfoMap =
    Array.isArray(klubinfoRows)
      ? klubinfoRows.reduce((acc: Record<string, string>, r: any) => {
          const key = String(r?.key ?? r?.id ?? "").trim();
          const value = String(r?.value ?? r?.val ?? r?.text ?? "").trim();
          if (key) acc[key] = value;
          return acc;
        }, {})
      : ({} as Record<string, string>);

  const clubName = klubinfoMap["club.name"] || "Humlum Dartklub";
  const clubTagline = klubinfoMap["club.tagline"] || "Fællesskab & Præcision";

  // [HELP:HOME:HERO:TOGGLE] START
  // KLUBINFO keys:
  // - home.hero.show_text  = YES/NO (eller JA/NEJ)
  // NB: Vi viser ALDRIG hero-tekst mens vi loader (stopper “flash”)
  const heroTextCfg = String(klubinfoMap["home.hero.show_text"] ?? "YES")
    .trim()
    .toUpperCase();
  const heroShowText = !loading && heroTextCfg !== "NO" && heroTextCfg !== "NEJ";

  // [HELP:HOME:HERO:TOGGLE] END

  const heroTitle = d?.hero?.title || clubName;
  const heroSub = d?.hero?.subtitle || clubTagline;

  const cards = [
    {
      t: d?.cards?.c1_title || "Bliv medlem",
      href: (d?.cards?.c1_link || "/bliv-medlem").trim() || "/bliv-medlem",
    },
    {
      t: d?.cards?.c2_title || "Støt os & Bliv sponsor",
      href: (d?.cards?.c2_link || "/sponsor").trim() || "/sponsor",
    },
    {
      t: d?.cards?.c3_title || "Events & aktiviteter",
      href: (d?.cards?.c3_link || "/events").trim() || "/events",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* HERO */}
      <section className="hdk-hero hdk-home-hero mt-6 relative overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 z-0">
          <HeroBackdropSlider />
        </div>

        <div className="relative z-10 hdk-hero-inner px-4 sm:px-6 md:px-8 py-6">
          <div className="max-w-[min(92vw,760px)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div>
                {heroShowText ? (
                  <>
                    <h1 className="hdk-hero-title text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight md:leading-[1.1] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                      {heroTitle}
                    </h1>

                    <p className="hdk-hero-sub mt-2 text-base sm:text-lg md:text-2xl leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                      {heroSub}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ens “kort-format” */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Kort 1: Kom i gang */}
        <div className="card h-full flex flex-col">
          <div className="kicker mb-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            START HER
          </div>

          <h3 className="text-lg font-semibold text-gray-900">Kom i gang</h3>
          <p className="mt-2 text-sm text-gray-600">
            Vælg din vej ind i klubben — hurtigt og enkelt.
          </p>

          <div className="mt-4 grid gap-3">
            <Link href={cards[0].href} className="btn btn-primary btn-primary-soft w-full">
              {cards[0].t} →
            </Link>
            <Link href={cards[1].href} className="btn btn-primary btn-primary-soft w-full">
              {cards[1].t} →
            </Link>
            <Link href={cards[2].href} className="btn btn-primary btn-primary-soft w-full">
              {cards[2].t} →
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/medlemslogin" className="btn btn-primary btn-primary-soft w-full">
              Medlemslogin
            </Link>
            <Link href="/sponsorvaeg" className="btn btn-primary btn-primary-soft w-full">
              Sponsorvæg
            </Link>
            <Link href="/academy" className="btn btn-primary btn-primary-soft w-full">
              Dart Academy
            </Link>
            {/* [HELP:HOME:START_HER:OM_LINK] START */}
<Link href="/om" className="btn btn-primary btn-primary-soft w-full">
  Om klubben
</Link>
{/* [HELP:HOME:START_HER:OM_LINK] END */}

          </div>
        </div>

        {/* Kort 2: Sponsorer */}
        <SponsorCard />

        {/* Kort 3: Nyheder */}
        <NewsHeroOverlay />
      </section>

      <section className="mt-8 mb-10 text-right text-xs text-slate-500">
        {loading
          ? "Loader data..."
          : state.updated
            ? `Sidst opdateret: ${new Date(state.updated).toLocaleString("da-DK")}`
            : ""}
      </section>
    </main>
  );
}
