"use client";

import { useEffect, useState } from "react";

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={["rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg", className].join(" ")}>
      {children}
    </section>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-white/5 px-3 py-1 text-xs">
        <span className="h-2 w-2 rounded-full bg-lime-400" />
        {icon} {title.toUpperCase()}
      </div>
      {subtitle ? <p className="mt-3 opacity-80">{subtitle}</p> : null}
    </div>
  );
}

export default function MedlemszonePage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // Simpel client-side gate via localStorage (pladsholder)
    const ok = typeof window !== "undefined" && localStorage.getItem("member_access") === "1";
    setAllowed(ok);
  }, []);

  if (allowed === null) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <SectionCard><p>Loader…</p></SectionCard>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <SectionCard>
          <SectionHeader icon="🚫" title="Ingen adgang" subtitle="Denne side er kun for medlemmer." />
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/medlemslogin" className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
              Gå til login
            </a>
            <a href="/bliv-medlem" className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-lime-400 text-black hover:opacity-90 transition">
              Bliv medlem
            </a>
          </div>
        </SectionCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro */}
      <SectionCard>
        <SectionHeader icon="✅" title="Medlemszone" subtitle="Internt område for medlemmer. Alt her er work-in-progress / pladsholdere." />
        <p className="mt-3 opacity-80 text-sm">
          Når vi går live kobler vi disse kort til Google Sheets / Docs / Calendar og din Apps Script-API.
        </p>
      </SectionCard>

      {/* Kort / sektioner i samme card-look */}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard>
          <h3 className="text-lg font-semibold">Træningsprogram</h3>
          <p className="mt-2 text-sm opacity-90">
            Ugeplaner, fokusområder og øvelser. (Sheets/Docs-integration kommer her.)
          </p>
          <a href="#" className="mt-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
            Åbn pladsholder
          </a>
        </SectionCard>

        <SectionCard>
          <h3 className="text-lg font-semibold">Dokumenter</h3>
          <p className="mt-2 text-sm opacity-90">
            Interne PDF’er, vedtægter, notater. (Linker til Drive/Docs senere.)
          </p>
          <a href="#" className="mt-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
            Åbn pladsholder
          </a>
        </SectionCard>

        <SectionCard>
          <h3 className="text-lg font-semibold">Kalender</h3>
          <p className="mt-2 text-sm opacity-90">
            Træningstider og events. (Google Calendar embed / feed her.)
          </p>
          <a href="#" className="mt-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
            Åbn pladsholder
          </a>
        </SectionCard>

        <SectionCard>
          <h3 className="text-lg font-semibold">Noter & opslag</h3>
          <p className="mt-2 text-sm opacity-90">
            Hurtige beskeder til holdet, to-do, referater. (Simpel editor eller Sheets-faneblad.)
          </p>
          <a href="#" className="mt-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
            Åbn pladsholder
          </a>
        </SectionCard>

        <SectionCard>
          <h3 className="text-lg font-semibold">Øvelsesvideoer</h3>
          <p className="mt-2 text-sm opacity-90">
            Samling af korte klip med teknik og doubler. (Thumbnails/embeds senere.)
          </p>
          <a href="#" className="mt-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
            Åbn pladsholder
          </a>
        </SectionCard>

        <SectionCard>
          <h3 className="text-lg font-semibold">Kontakt træner</h3>
          <p className="mt-2 text-sm opacity-90">
            Hurtig kontakt til Academy-ansvarlig. (Kontaktformular / mailto senere.)
          </p>
          <a href="#" className="mt-4 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold border bg-white/10 hover:bg-white/15 transition">
            Åbn pladsholder
          </a>
        </SectionCard>
      </div>
    </main>
  );
}
