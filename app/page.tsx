"use client";

import { useEffect, useState } from "react";
import { getForsideData, SheetMap } from "../lib/getForsideData";
import Link from "next/link";

type ViewState = { map: SheetMap; updated?: string };

export default function Page() {
  const [state, setState] = useState<ViewState>({ map: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getForsideData();
      setState(data);
      setLoading(false);
    })();
  }, []);

  const d = state.map;

  const heroTitle = d?.hero?.title || "Humlum Dartklub";
  const heroSub = d?.hero?.subtitle || "Fællesskab & Præcision";
  const heroImage = (d?.hero?.hero_image || "assets/hero.jpg").replace(/^\//, "");

  const cards = [
    { t: d?.cards?.c1_title || "Bliv medlem", href: (d?.cards?.c1_link || "/bliv-medlem").trim() || "/bliv-medlem" },
    { t: d?.cards?.c2_title || "Sponsor os", href: (d?.cards?.c2_link || "/sponsor").trim() || "/sponsor" },
    { t: d?.cards?.c3_title || "Events & aktiviteter", href: (d?.cards?.c3_link || "/events").trim() || "/events" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

      {/* HERO – untouched */}
      <section
        className="hdk-hero mt-6"
        style={{ backgroundImage: `url(/${heroImage})` }}
      >
        <div className="hdk-hero-inner">
          <div className="max-w-4xl">
            <h1 className="hdk-hero-title text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              {heroTitle}
            </h1>
            <p className="hdk-hero-sub mt-3 text-lg sm:text-xl md:text-2xl">
              {heroSub}
            </p>
          </div>
        </div>
      </section>

      {/* 3 KORT */}
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

      {/* Medlemslogin sektion */}
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

      {/* Links & Info sektion */}
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
              <li><a href="https://www.pdc.tv/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">PDC</a></li>
              <li><a href="https://dart-ddu.dk/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">DDU</a></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 mb-10 text-right text-xs text-slate-500">
        {loading
          ? "Loader data…"
          : state.updated
            ? `Sidst opdateret: ${new Date(state.updated).toLocaleString("da-DK")}`
            : ""}
      </section>
    </main>
  );
}
