"use client";

import { useMemo, useState } from "react";

/* ======================================
   Konstanter & typer
   ====================================== */
const CLICK_MIN = 25;
const CLICK_MAX = 100_000;

/** Skift dette til din rigtige formular-URL hvis den er ekstern (Google Form el.lign.) */
const SPONSOR_FORM_HREF = "/sponsor/tilmelding"; // <- juster hvis du har en anden sti

type PackageKey = "bronze" | "silver" | "gold";
type Package = {
  key: PackageKey;
  name: string;
  icon: string;
  priceYear: number;
  badge?: string;
  features: string[];
};

type AddOnKey = "youth" | "events" | "gear";
type AddOn = {
  key: AddOnKey;
  name: string;
  icon: string;
  // Én pris-type pr. tilkøb (enten monthly ELLER yearly)
  monthly?: number;
  yearly?: number;
  hint?: string;
};

/* ======================================
   Data (pakker & tilkøb)
   ====================================== */
const PACKAGES: Package[] = [
  {
    key: "bronze",
    name: "Bronze",
    icon: "🥉",
    priceYear: 2500,
    features: [
      "Logo på hjemmeside (sponsorvæg)",
      "Tak i SoMe 1× årligt",
      "Klubcertifikat til butik/kontor",
    ],
  },
  {
    key: "silver",
    name: "Sølv",
    icon: "🥈",
    priceYear: 5000,
    badge: "Populær",
    features: [
      "Alt i Bronze",
      "Logo på event-rollup i klublokalet",
      "Omtale ved events",
      "Tak i SoMe 2× årligt",
    ],
  },
  {
    key: "gold",
    name: "Guld",
    icon: "🥇",
    priceYear: 10000,
    features: [
      "Alt i Sølv",
      "Logo på træningstrøjer (ærme)",
      "Årlig firma-dart aften (2 timer)",
      "Profil på sponsorvæg + link",
    ],
  },
];

const ADDONS: AddOn[] = [
  {
    key: "youth",
    name: "Youth sponsor",
    icon: "🧒",
    monthly: 50,
    hint: "Hjælp unge spillere med træning & udstyr",
  },
  {
    key: "events",
    name: "Event sponsor",
    icon: "🎪",
    yearly: 1000,
    hint: "Synlighed ved klubarrangementer",
  },
  {
    key: "gear",
    name: "Udstyr sponsor",
    icon: "🎯",
    yearly: 1500,
    hint: "Bidrag til tavler, stativer og materialer",
  },
];

/* ======================================
   Utils
   ====================================== */
const fmt = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});
const fmt0 = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 });

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

function addonPriceLabel(a: AddOn) {
  if (a.monthly) return `${fmt.format(a.monthly)}/md.`;
  if (a.yearly) return `${fmt.format(a.yearly)}/år`;
  return "";
}

/* ======================================
   Komponent
   ====================================== */
export default function SponsorPage() {
  /* Pakkevalg (kan nu toggles FRA ved klik på valgt pakke) */
  const [selected, setSelected] = useState<PackageKey | null>(null);

  /* Ét-klik støtte */
  const [clickActive, setClickActive] = useState(false);
  const [clickAmount, setClickAmount] = useState<number>(500);
  const quick = [50, 100, 200, 500, 1000];

  /* Øremærkning */
  const [clickAnon, setClickAnon] = useState(false);
  const [tags, setTags] = useState({
    dartskive: true,
    udstyr: false,
    ungdom: false,
    arrangementer: false,
    drift: false,
  });
  const toggleTag = (k: keyof typeof tags) =>
    setTags((t) => ({ ...t, [k]: !t[k] }));

  /* Tilkøb (toggle) */
  const [selectedAddOns, setSelectedAddOns] = useState<Record<AddOnKey, boolean>>({
    youth: false,
    events: false,
    gear: false,
  });
  const toggleAddon = (k: AddOnKey) =>
    setSelectedAddOns((s) => ({ ...s, [k]: !s[k] }));

  /* Summering */
  const baseYear = useMemo(() => {
    const p = PACKAGES.find((x) => x.key === selected);
    return p ? p.priceYear : 0;
  }, [selected]);

  const addOnsYear = useMemo(() => {
    let y = 0;
    ADDONS.forEach((a) => {
      if (selectedAddOns[a.key] && a.yearly) y += a.yearly;
    });
    return y;
  }, [selectedAddOns]);

  const addOnsMonth = useMemo(() => {
    let m = 0;
    ADDONS.forEach((a) => {
      if (selectedAddOns[a.key] && a.monthly) m += a.monthly;
    });
    return m;
  }, [selectedAddOns]);

  const oneClick = clickActive ? clamp(clickAmount, CLICK_MIN, CLICK_MAX) : 0;

  const totalYear = baseYear + addOnsYear + addOnsMonth * 12 + oneClick;
  const totalMonth = Math.round(totalYear / 12);

  const earmarkList = Object.entries(tags)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const anyAddon = useMemo(() => Object.values(selectedAddOns).some(Boolean), [selectedAddOns]);
  const readyForForm = Boolean(selected || clickActive || anyAddon);

  /* Udskrift / kopi / mail */
  const buildSummaryText = () => {
    const p = PACKAGES.find((x) => x.key === selected);
    const lines: string[] = [];
    lines.push("Humlum Dartklub — Sponsoropsummering");
    lines.push("==================================");
    if (p) {
      lines.push(`Pakke: ${p.name} (${fmt.format(p.priceYear)}/år)`);
    } else {
      lines.push("Pakke: (ingen valgt)");
    }
    if (clickActive) {
      lines.push(`Ét-klik støtte: ${fmt.format(oneClick)} (engang)`);
      if (clickAnon) lines.push(`  • Anonym støtte: JA`);
      if (earmarkList.length) lines.push(`  • Øremærkning: ${earmarkList.join(", ")}`);
    }
    const chosenAddons = ADDONS.filter((a) => selectedAddOns[a.key]);
    if (chosenAddons.length) {
      lines.push("Tilkøb:");
      chosenAddons.forEach((a) => {
        lines.push(`  • ${a.name} (${addonPriceLabel(a)})`);
      });
    }
    lines.push("----------------------------------");
    lines.push(`I alt pr. år:    ${fmt.format(totalYear)}`);
    lines.push(`Ca. pr. måned:  ${fmt.format(totalMonth)}`);
    return lines.join("\n");
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
    if (!w) return;
    w.document.write(`<pre style="font:14px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; padding:16px;">${buildSummaryText()}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      alert("Teksten er kopieret til udklipsholderen.");
    } catch {
      alert("Kunne ikke kopiere. Prøv print i stedet.");
    }
  };

  const handleMail = () => {
    const body = encodeURIComponent(buildSummaryText());
    window.location.href = `mailto:?subject=Sponsoropsummering%20-%20Humlum%20Dartklub&body=${body}`;
  };

  /* ======================================
     UI
     ====================================== */
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro */}
      <section className="section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          SPONSORER
        </div>
        <h1 className="section-title">Støt Humlum Dartklub</h1>
        <div className="section-underline" />
        <p className="section-subtitle">
          Vælg en pakke og/eller støt med et valgfrit beløb. Opsummeringen kan printes, kopieres eller sendes som e-mail.
        </p>
      </section>

      {/* Pakker + ét-klik */}
      <section className="mt-8 rounded-3xl border border-lime-400 bg-white p-6 shadow-md">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          PAKKER & ÉT-KLIK STØTTE
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {PACKAGES.map((p) => {
            const isSel = selected === p.key;
            return (
              <div
                key={p.key}
                className={[
                  "h-full rounded-3xl border bg-white p-6 shadow-md transition",
                  "border-lime-400 hover:shadow-lg hover:-translate-y-0.5",
                  isSel ? "ring-2 ring-lime-400/70" : "",
                  "flex flex-col",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    <span className="mr-2">{p.icon}</span>{p.name}
                  </h3>
                  {p.badge && (
                    <span className="rounded-full border border-lime-300/60 bg-lime-50 px-2 py-0.5 text-xs text-gray-700">
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-2xl font-extrabold text-gray-900">
                  {fmt.format(p.priceYear)} <span className="text-sm font-normal opacity-70">/år</span>
                </p>

                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 min-h-[96px]">
                  {p.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>

                <button
                  onClick={() => setSelected(isSel ? null : p.key)}
                  className="mt-auto w-full btn btn-primary"
                >
                  {isSel ? "Fjern pakke" : "Vælg pakke"}
                </button>
              </div>
            );
          })}

          {/* Støt med ét klik */}
          <div
            className={[
              "h-full text-left rounded-3xl border p-6 shadow-md transition",
              "border-lime-400 hover:shadow-lg hover:-translate-y-0.5",
              clickActive ? "ring-2 ring-lime-400/70" : "",
              "bg-white flex flex-col",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">💚 Støt med ét klik</h3>
              <span className="text-xs opacity-70">{fmt0.format(clickActive ? clickAmount : 0)} kr. engang</span>
            </div>

            {/* Quick beløb */}
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  className={[
                    "rounded-full border px-3 py-1 text-sm",
                    q === clickAmount ? "border-lime-400 bg-lime-50" : "border-lime-200 bg-white hover:bg-lime-50",
                  ].join(" ")}
                  onClick={() => { setClickAmount(q); setClickActive(true); }}
                >
                  {fmt0.format(q)} kr
                </button>
              ))}
            </div>

            {/* Beløb input */}
            <div className="mt-3">
              <label className="text-sm">Beløb</label>
              <input
                className="input-light mt-1 w-full"
                type="number"
                min={CLICK_MIN}
                max={CLICK_MAX}
                value={clickAmount}
                onChange={(e) => setClickAmount(clamp(Number(e.target.value || 0), CLICK_MIN, CLICK_MAX))}
                onFocus={() => setClickActive(true)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Min {CLICK_MIN} kr · Max {fmt0.format(CLICK_MAX)} kr. Større beløb? Skriv – vi kontakter dig diskret.
              </p>
            </div>

            {/* Øremærkning – fold-out */}
            <details className="mt-3 rounded-xl border border-lime-300/60 bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm">Øremærkning (valgfrit)</summary>
              <div className="mt-3 space-y-2 text-sm text-gray-800">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={clickAnon} onChange={() => setClickAnon(!clickAnon)} />
                  Anonym støtte
                </label>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={tags.dartskive} onChange={() => toggleTag("dartskive")} />
                    Dartskive
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={tags.udstyr} onChange={() => toggleTag("udstyr")} />
                    Udstyr
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={tags.ungdom} onChange={() => toggleTag("ungdom")} />
                    Ungdom
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={tags.arrangementer} onChange={() => toggleTag("arrangementer")} />
                    Arrangementer
                  </label>
                  <label className="inline-flex items-center gap-2 col-span-2">
                    <input type="checkbox" checked={tags.drift} onChange={() => toggleTag("drift")} />
                    Generel drift
                  </label>
                </div>
              </div>
            </details>

            <button
              onClick={() => setClickActive(!clickActive)}
              className="mt-auto w-full btn btn-primary"
            >
              {clickActive ? "Fjern støtte" : "Tilføj støtte"}
            </button>
          </div>
        </div>
      </section>

      {/* Tilkøb */}
      <section className="mt-8 rounded-3xl border border-lime-400 bg-white p-6 shadow-md">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          TILKØB
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((a) => {
            const active = !!selectedAddOns[a.key];
            return (
              <div
                key={a.key}
                className={[
                  "h-full text-left rounded-3xl border p-4 shadow-md transition",
                  "border-lime-400 hover:shadow-lg hover:-translate-y-0.5",
                  active ? "ring-2 ring-lime-400/70" : "",
                  "bg-white flex flex-col",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-900">
                    <span className="mr-2">{a.icon}</span>
                    {a.name}
                  </h4>
                  <span className="text-sm text-gray-700">{addonPriceLabel(a)}</span>
                </div>
                {a.hint && <p className="mt-1 text-xs text-gray-600 min-h-[36px]">{a.hint}</p>}
                <button onClick={() => toggleAddon(a.key)} className="mt-auto w-full btn btn-primary">
                  {active ? "Tilvalgt" : "Vælg"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Opsummering */}
      <section className="mt-8 rounded-3xl border border-lime-400 bg-white p-6 shadow-md">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-lime-500" />
          OPSUMMERING
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-lime-300/60 bg-lime-50 p-4 text-sm">
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt>Pakke</dt>
                <dd className="font-semibold">
                  {selected ? PACKAGES.find((x) => x.key === selected)?.name : "(ingen)"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Pakke pr. år</dt>
                <dd>{fmt.format(baseYear)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tilkøb pr. år</dt>
                <dd>{fmt.format(addOnsYear)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tilkøb pr. måned</dt>
                <dd>{fmt.format(addOnsMonth)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ét-klik støtte</dt>
                <dd>{fmt.format(oneClick)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-lime-300/60 bg-white p-4">
            <p className="text-lg">I alt pr. år</p>
            <p className="text-3xl font-extrabold text-gray-900">{fmt.format(totalYear)}</p>
            <p className="mt-1 text-sm opacity-70">ca. {fmt.format(totalMonth)} pr. måned</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={handlePrint} className="btn btn-primary">Print</button>
              <button onClick={handleCopy} className="btn btn-primary">Kopiér tekst</button>
              <button onClick={handleMail} className="btn btn-primary">Send mail</button>
              {/* Skema-link tilbage igen */}
              <a href={SPONSOR_FORM_HREF} className="btn btn-primary">Udfyld sponsor-skema</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
