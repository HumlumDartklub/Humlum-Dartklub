"use client";

/** [HELP:HOME:IMPORTS] START
 * Pitch: Importer. Rør ikke disse, medmindre du tilføjer/renamer komponenter eller datafunktioner.
 * [HELP:HOME:IMPORTS] END */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getForsideData } from "../lib/getForsideData";
import type { SheetMap } from "../lib/getForsideData";
import NewsHeroOverlay from "../components/NewsHeroOverlay";
import HeroBackdropSlider from "../components/HeroBackdropSlider";

/** [HELP:HOME:TYPES] START
 * Pitch: Typer der bruges lokalt i denne side.
 * [HELP:HOME:TYPES] END */
type ViewState = { map: SheetMap; updated?: string };

export default function Page() {
  /** [HELP:HOME:STATE] START
   * Pitch: Lokal state for forsiden. `state.map` rummer data fra Google Sheet (via getForsideData).
   * `loading` styrer den lille status i bunden.
   * [HELP:HOME:STATE] END */
  const [state, setState] = useState<ViewState>({ map: {} as SheetMap });
  const [loading, setLoading] = useState(true);

  /** [HELP:HOME:DATA:FETCH] START
   * Pitch: Henter data til forsiden (hero-tekster, kort-titler/links, mm.)
   * [HELP:HOME:DATA:FETCH] END */
  useEffect(() => {
    (async () => {
      const data = await getForsideData();
      setState(data as any);
      setLoading(false);
    })();
  }, []);

  /** [HELP:HOME:DATA:MAP] START
   * Pitch: Aflæsning af felter fra datastrukturen.
   * `heroTitle` og `heroSub` falder tilbage til faste strenge, hvis sheet ikke giver værdi.
   * [HELP:HOME:DATA:MAP] END */
  const d = state.map || ({} as any);
  /** [HELP:HOME:HERO:TEXTS] START — hero-overskrift/undertitel (kan styres via Sheet) */
  const heroTitle = d?.hero?.title || "Humlum Dartklub";
  const heroSub = d?.hero?.subtitle || "Fællesskab & Præcision";
  /** [HELP:HOME:HERO:TEXTS] END */

  /** [HELP:HOME:NAV-CARDS] START
   * Pitch: De tre forside-kort (linkbokse). Ret kun tekster/links her.
   * Under-ankre gør det nemt at ændre ét kort ad gangen.
   * [HELP:HOME:NAV-CARDS] END */
  const cards = [
    // [HELP:HOME:NAV-CARDS:MEMBER] START — kort 1 (Bliv medlem)
    { t: d?.cards?.c1_title || "Bliv medlem", href: (d?.cards?.c1_link || "/bliv-medlem").trim() || "/bliv-medlem" },
    // [HELP:HOME:NAV-CARDS:MEMBER] END

    // [HELP:HOME:NAV-CARDS:SPONSOR] START — kort 2 (Sponsor os)
    // Hvis du vil omdøbe til "Støt os Bliv sponsor", erstat blot tekststrengen her.
    { t: d?.cards?.c2_title || "Støt os Bliv sponsor", href: (d?.cards?.c2_link || "/sponsor").trim() || "/sponsor" },
    // [HELP:HOME:NAV-CARDS:SPONSOR] END

    // [HELP:HOME:NAV-CARDS:EVENTS] START — kort 3 (Events & aktiviteter)
    { t: d?.cards?.c3_title || "Events & aktiviteter", href: (d?.cards?.c3_link || "/events").trim() || "/events" }
    // [HELP:HOME:NAV-CARDS:EVENTS] END
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* [HELP:HOME:SECTION:HERO] START
          Pitch: HERO — baggrunds-slideshow, stor titel, undertitel og nyhedsboks. */}
      <section className="hdk-hero mt-6 relative overflow-hidden rounded-[2rem]">
        {/* [HELP:HOME:HERO:BACKDROP] START — baggrundsslider */}
        <div className="absolute inset-0 z-0">
          <HeroBackdropSlider />
        </div>
        {/* [HELP:HOME:HERO:BACKDROP] END */}

        {/* [HELP:HOME:HERO:TEXTLAYER] START — forgrundstekster (titel/undertitel) */}
        <div className="relative z-10 hdk-hero-inner px-4 sm:px-6 md:px-8 py-6">
          <div className="max-w-[min(92vw,760px)]">
            <h1
              className="
                hdk-hero-title
                text-3xl sm:text-5xl md:text-6xl
                font-extrabold tracking-tight
                leading-tight md:leading-[1.1]
                drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]
              "
            >
              {heroTitle}
            </h1>

            <p
              className="
                hdk-hero-sub mt-2
                text-base sm:text-xl md:text-2xl
                leading-snug md:leading-snug
                drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]
              "
            >
              {heroSub}
            </p>
          </div>
        </div>
        {/* [HELP:HOME:HERO:TEXTLAYER] END */}

        {/* [HELP:HOME:HERO:NEWS] START — nyhedsboks nederst-højre */}
        <NewsHeroOverlay />
        {/* [HELP:HOME:HERO:NEWS] END */}
      </section>
      {/* [HELP:HOME:SECTION:HERO] END */}

      {/* [HELP:HOME:SECTION:NAV-CARDS] START
          Pitch: 3 kort med links til centrale undersider. Tekst/links styres af `cards` ovenfor. */}
      <section className="mt-10 card-grid sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <Link key={i} href={c.href} className="card group">
            <h3 className="text-lg font-semibold text-gray-900">{c.t}</h3>
            <p className="mt-2 text-sm text-gray-600">Klik for at læse mere.</p>
            <div className="card-footer">
              <span className="btn btn-primary">Gå til →</span>
            </div>
          </Link>
        ))}
      </section>
      {/* [HELP:HOME:SECTION:NAV-CARDS] END */}

      {/* [HELP:HOME:SECTION:LOGIN] START
          Pitch: Medlemslogin sektion. Kun tekster/knap-link. */}
      <section className="mt-12 section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          MEDLEMSLOGIN
        </div>

        <h2 className="section-title">Medlemslogin</h2>
        <div className="section-underline" />
        <p className="section-subtitle">
          Adgang til interne dokumenter, træningsmaterialer og medlemsside.
        </p>

        <div className="mt-4">
          <Link href="/medlemslogin" className="btn btn-primary">
            Gå til medlemslogin
          </Link>
        </div>
      </section>
      {/* [HELP:HOME:SECTION:LOGIN] END */}

      {/* [HELP:HOME:SECTION:LINKS] START
          Pitch: Info & eksterne links. Tilpas kun tekster/URL'er. */}
      <section className="mt-12 section-header">
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
              <li>Humlum Dartklub</li>
              <li>Fællesskab & Præcision</li>
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
                  PDC
                </a>
              </li>
              <li>
                <a
                  href="https://dart-ddu.dk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                >
                  DDU
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
      {/* [HELP:HOME:SECTION:LINKS] END */}

      {/* [HELP:HOME:SECTION:UPDATED] START
          Pitch: Lille statuslinje nederst med "Sidst opdateret". */}
      <section className="mt-8 mb-10 text-right text-xs text-slate-500">
        {loading
          ? "Loader data..."
          : state.updated
            ? `Sidst opdateret: ${new Date(state.updated).toLocaleString("da-DK")}`
            : ""}
      </section>
      {/* [HELP:HOME:SECTION:UPDATED] END */}
    </main>
  );
}
