"use client";

/** [HELP:HOME:IMPORTS] START
 * Pitch: Importer. Rør ikke disse, medmindre du tilføjer/renamer komponenter eller datafunktioner.
 * [HELP:HOME:IMPORTS] END */
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getForsideData } from "../lib/getForsideData";
import type { SheetMap } from "../lib/getForsideData";
import NewsHeroOverlay from "../components/NewsHeroOverlay";
import HeroBackdropSlider from "../components/HeroBackdropSlider";

/** [HELP:HOME:TYPES] START */
type ViewState = { map: SheetMap; updated?: string };
/** [HELP:HOME:TYPES] END */

export default function Page() {
  /** [HELP:HOME:STATE] START */
  const [state, setState] = useState<ViewState>({ map: {} as SheetMap });
  const [loading, setLoading] = useState(true);
  /** [HELP:HOME:STATE] END */

  /** [HELP:HOME:DATA:FETCH] START */
  useEffect(() => {
    (async () => {
      const data = await getForsideData();
      setState(data as any);
      setLoading(false);
    })();
  }, []);
  /** [HELP:HOME:DATA:FETCH] END */

  /** [HELP:HOME:DATA:MAP] START */
  const d = state.map || ({} as any);

  const klubinfoRows = (d?.KLUBINFO as any[]) || [];
  const klubinfoMap =
    Array.isArray(klubinfoRows)
      ? klubinfoRows.reduce((acc: Record<string, string>, row: any) => {
          if (!row) return acc;
          const key = (row.key ?? "").toString().trim();
          if (!key) return acc;
          const visible = (row.visible ?? "").toString().trim().toUpperCase();
          if (visible && visible !== "YES") return acc;
          const value = (row.value ?? "").toString();
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      : ({} as Record<string, string>);

  const clubName = klubinfoMap["club.name"] || "Humlum Dartklub";
  const clubTagline = klubinfoMap["club.tagline"] || "Fællesskab & Præcision";

  const heroTitle = d?.hero?.title || clubName || "Humlum Dartklub";
  const heroSub = d?.hero?.subtitle || clubTagline || "Fællesskab & Præcision";
  /** [HELP:HOME:DATA:MAP] END */

  /** [HELP:HOME:NAV-CARDS] START */
  const cards = [
    {
      t: d?.cards?.c1_title || "Bliv medlem",
      href: (d?.cards?.c1_link || "/bliv-medlem").trim() || "/bliv-medlem",
    },
    {
      t: d?.cards?.c2_title || "Støt os Bliv sponsor",
      href: (d?.cards?.c2_link || "/sponsor").trim() || "/sponsor",
    },
    {
      t: d?.cards?.c3_title || "Events & aktiviteter",
      href: (d?.cards?.c3_link || "/events").trim() || "/events",
    },
  ];
  /** [HELP:HOME:NAV-CARDS] END */

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* [HELP:HOME:SECTION:HERO] START */}
      <section className="hdk-hero mt-6 relative overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 z-0">
          <HeroBackdropSlider />
        </div>

        <div className="relative z-10 hdk-hero-inner px-4 sm:px-6 md:px-8 py-6">
          <div className="max-w-[min(92vw,760px)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* Logo inde i hero – gør det mere synligt */}
              <div className="relative h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 flex-shrink-0">
                <Image
                  src="/images/logo/humlum-logo.png"
                  alt="Humlum Dartklub logo"
                  fill
                  sizes="(min-width: 1024px) 7rem, (min-width: 640px) 6rem, 5rem"
                  className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
                  priority
                />
              </div>

              <div>
                <h1 className="hdk-hero-title text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-[1.1] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  {heroTitle}
                </h1>

                <p className="hdk-hero-sub mt-2 text-base sm:text-xl md:text-2xl leading-snug md:leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                  {heroSub}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* [HELP:HOME:SECTION:HERO] END */}

      {/* [HELP:HOME:SECTION:GRID] START — hovedkort + nyheder */}
      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Kort 1: Bliv medlem */}
        <Link href={cards[0].href} className="card group">
          <h3 className="text-lg font-semibold text-gray-900">{cards[0].t}</h3>
          <p className="mt-2 text-sm text-gray-600">Klik for at læse mere.</p>
          <div className="card-footer">
            <span className="btn btn-primary">Gå til →</span>
          </div>
        </Link>

        {/* Kort 2: Støt os / Bliv sponsor */}
        <Link href={cards[1].href} className="card group">
          <h3 className="text-lg font-semibold text-gray-900">{cards[1].t}</h3>
          <p className="mt-2 text-sm text-gray-600">Klik for at læse mere.</p>
          <div className="card-footer">
            <span className="btn btn-primary">Gå til →</span>
          </div>
        </Link>

        {/* Nyhedskort – fylder højre kolonne, begge rækker */}
        <div className="lg:row-span-2">
          <NewsHeroOverlay />
        </div>

        {/* Kort 3: Events & aktiviteter */}
        <Link href={cards[2].href} className="card group">
          <h3 className="text-lg font-semibold text-gray-900">{cards[2].t}</h3>
          <p className="mt-2 text-sm text-gray-600">Klik for at læse mere.</p>
          <div className="card-footer">
            <span className="btn btn-primary">Gå til →</span>
          </div>
        </Link>

        {/* Kort 4: Medlemslogin */}
        <Link href="/medlemslogin" className="card group">
          <div className="kicker mb-1">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            MEDLEMSLOGIN
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Medlemslogin</h3>
          <p className="mt-2 text-sm text-gray-600">
            Adgang til interne dokumenter, træningsmaterialer og medlemsside.
          </p>
          <div className="card-footer">
            <span className="btn btn-primary">Gå til medlemslogin</span>
          </div>
        </Link>
      </section>
      {/* [HELP:HOME:SECTION:GRID] END */}

      {/* [HELP:HOME:SECTION:LINKS+SPONSOR] START
          Nederst: INFO-kort + Sponsorvæg-kort ved siden af hinanden */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Venstre: Nyttige links (uændret indhold, bare i egen "card") */}
        <div className="section-header">
          <div className="kicker">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            INFO & LINKS
          </div>

          <h2 className="section-title">Nyttige links</h2>
          <div className="section-underline" />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold">Forening</h4>
              <ul className="mt-1 text-sm opacity-80">
                <li>{clubName}</li>
                <li>{clubTagline}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Eksterne links</h4>
              <ul className="mt-1 text-sm">
                <li>
                  <a
                    href="https://www.pdc.tv/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                  >
                    Professional Darts Corporation (PDC)
                  </a>
                </li>
                <li>
                  <a
                    href="https://dart-ddu.dk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                  >
                    Dansk Dart Union (DDU)
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Højre: sponsorvæg-card (samme højde/udtryk som de andre kort) */}
        <Link href="/sponsorvaeg" className="card group">
          <div className="kicker mb-1">
            <span className="h-2 w-2 rounded-full bg-lime-500" />
            SPONSORVÆG
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Vores sponsorer
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Se de virksomheder og personer, der gør Humlum Dartklub mulig.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Alle sponsorer vises på væggen
          </p>
          <div className="card-footer">
            <span className="btn btn-primary">Åbn sponsorvæg →</span>
          </div>
        </Link>
      </section>
      {/* [HELP:HOME:SECTION:LINKS+SPONSOR] END */}

      {/* [HELP:HOME:SECTION:UPDATED] START */}
      <section className="mt-8 mb-10 text-right text-xs text-slate-500">
        {loading
          ? "Loader data..."
          : state.updated
            ? `Sidst opdateret: ${new Date(state.updated).toLocaleString(
                "da-DK",
              )}`
            : ""}
      </section>
      {/* [HELP:HOME:SECTION:UPDATED] END */}
    </main>
  );
}
