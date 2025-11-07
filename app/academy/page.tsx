"use client";

import Link from "next/link";

export default function AcademyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

      <header className="section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          ACADEMY
        </div>
        <h1 className="section-title">Humlum Dart Academy</h1>
        <div className="section-underline" />
        <p className="section-subtitle">
          Træning med struktur og ro i kroppen. Vi bygger teknik og spilforståelse trin for trin,
          så både nye og erfarne spillere kan udvikle sig og have det sjovt i fællesskab.
        </p>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <article className="card">
          <h3 className="text-lg font-semibold">🟡 Rookie</h3>
          <p className="mt-1 text-sm text-gray-600">Absolut begynder – jeg rammer skiven… indimellem 😅</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Fundament: greb, stance, sigte, release og follow-through</li>
            <li>• Rammeøvelser: “around the board” (singles) og lette doubler</li>
            <li>• Mini-mål: stabil rytme og ensartet kast (30 min, 3× pr. uge)</li>
          </ul>
          <div className="card-footer">
            <Link href="/bliv-medlem" className="btn btn-primary mt-4">Start her</Link>
          </div>
        </article>

        <article className="card">
          <h3 className="text-lg font-semibold">🟢 Øvet</h3>
          <p className="mt-1 text-sm text-gray-600">Jeg kan ramme — nu vil jeg ramme oftere og klogere 🎯</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Scoringstryk: 60–100 serier, doubler under tidspres</li>
            <li>• Sæt-tænkning: out-charts og bedre beslutninger</li>
            <li>• Fokus: stabilitet og tempo</li>
          </ul>
          <div className="card-footer">
            <Link href="/bliv-medlem" className="btn btn-primary mt-4">Start her</Link>
          </div>
        </article>

        <article className="card">
          <h3 className="text-lg font-semibold">🔷 Elite</h3>
          <p className="mt-1 text-sm text-gray-600">Jeg jagter pro-disciplin – is i maven og tal på tavlen.</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Match-simulering, rutiner, fokusblokke</li>
            <li>• Doubles og checkouts på split-times</li>
            <li>• Turnering: forberedelse og statistikmål</li>
          </ul>
          <div className="card-footer">
            <Link href="/bliv-medlem" className="btn btn-primary mt-4">Start her</Link>
          </div>
        </article>
      </section>

      <section className="mt-8 section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          FORLØB & TIDER
        </div>

        <p className="section-subtitle">
          Vi kører faste træningsforløb for Rookie, Øvet og Elite. Detaljeret <b>træningsprogram</b>,
          øvelsesark og holdplan ligger i medlemszonen. Få adgang med din kode eller bliv medlem i dag.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/medlemslogin" className="btn btn-primary">Gå til medlemslogin</Link>
          <Link href="/bliv-medlem" className="btn btn-primary">Bliv medlem</Link>
        </div>
      </section>
    </main>
  );
}
