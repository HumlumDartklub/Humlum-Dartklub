"use client";

/* [HELP:SPONSOR:IMPORTS] START
 * Pitch: Importer brugt af sponsorsiden. Tilføj her hvis du får brug for mere.
 * [HELP:SPONSOR:IMPORTS] END */
import { useEffect, useMemo, useState } from "react";

/* [HELP:SPONSOR:CONFIG] START
 * Pitch: Grundkonstanter og links du kan tilpasse uden at røre UI.
 * [HELP:SPONSOR:CONFIG] END */

/* [HELP:SPONSOR:CONFIG:LIMITS] START — Min/max for ét-klik beløb */
const CLICK_MIN = 25;
const CLICK_MAX = 100_000;
/* [HELP:SPONSOR:CONFIG:LIMITS] END */

/* [HELP:SPONSOR:FORM:LINK] START — URL til sponsor-tilmeldingsskema */
const SPONSOR_FORM_HREF = "/sponsor/tilmelding";
/* [HELP:SPONSOR:FORM:LINK] END */

/* [HELP:SPONSOR:SHEET:CONFIG] START — læs sponsorpakker fra HDK_Admin_v3 */
const SHEET_KEY = "hdk-admin-dev";
const SHEET_TAB_SPONSOR = "SPONSORPAKKER";

/**
 * Fane der styrer banesponsor-baner og om de er optaget
 * Kolonner (eksempel):
 *  - bane (1–6)
 *  - optaget (YES/TRUE/1 = optaget)
 *  - sponsor_navn (valgfrit)
 *  - note (valgfrit)
 */
const SHEET_TAB_BANESPONSOR_LANES = "BANESPONSOR_BANER";

type SheetRow = { [key: string]: any };

interface ApiListResponse {
  ok: boolean;
  items?: SheetRow[];
  error?: string;
  message?: string;
  tab?: string;
}

function normalizeString(value: any): string {
  return String(value ?? "").trim();
}

function isTruthyYes(value: any): boolean {
  const v = normalizeString(value).toUpperCase();
  return v === "YES" || v === "TRUE" || v === "1";
}
/* [HELP:SPONSOR:SHEET:CONFIG] END */

/* [HELP:SPONSOR:TYPES] START
 * Pitch: Typer til pakker og tilkøb.
 * [HELP:SPONSOR:TYPES] END */
type PackageKey = string;

type Package = {
  key: PackageKey;
  name: string;
  icon: string;
  priceYear: number;
  badge?: string;
  features: string[];
  priceUnit?: string;
  subtitle?: string;
  featured?: boolean;
};

type AddOnKey = "youth" | "events" | "gear";

type AddOn = {
  key: AddOnKey;
  name: string;
  icon: string;
  monthly?: number;
  yearly?: number;
  hint?: string;
};
/* [HELP:SPONSOR:TYPES] END */

/* [HELP:SPONSOR:PACKAGES:FALLBACK] START
 * Pitch: Fallback hvis Sheet ikke kan læses (bruges kun ved fejl).
 * [HELP:SPONSOR:PACKAGES:FALLBACK] END */
const FALLBACK_PACKAGES: Package[] = [
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
      "Årlig firma-dart aften (3 timer)",
      "Profil på sponsorvæg + link",
    ],
  },
];
/* [HELP:SPONSOR:PACKAGES:FALLBACK] END */

/* [HELP:SPONSOR:ADDONS:DATA] START
 * Pitch: Tilkøb. Ret navn/ikon/priser/hint her.
 * (KAN senere gøres Sheet-styret fra SPONSOR_TILKOEB.)
 * [HELP:SPONSOR:ADDONS:DATA] END */
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
    name: "Banesponsor",
    icon: "🎯",
    yearly: 1500,
    hint: "Bidrag til tavler, stativer og materialer. Logo ved den ønskede bane i klubben.",
  },
];
/* [HELP:SPONSOR:ADDONS:DATA] END */

/* [HELP:SPONSOR:BANES] START
 * Banesponsor-konfiguration (kan ændres senere)
 * [HELP:SPONSOR:BANES] END */
const BANESPONSOR_ADDON_KEY: AddOnKey = "gear";
const BANESPONSOR_LANES: number[] = [1, 2, 3, 4, 5, 6];

/**
 * Fallback for optagede baner, hvis BANESPONSOR_BANER-fanen ikke findes
 * eller er tom. Normalt vil du bare lade den være tom og styre alt via arket.
 */
const BANESPONSOR_TAKEN_LANES_FALLBACK: number[] = [];

/* [HELP:SPONSOR:UTILS] START
 * Pitch: Små hjælpefunktioner og formattering.
 * [HELP:SPONSOR:UTILS] END */
const fmt = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});

const fmt0 = new Intl.NumberFormat("da-DK", {
  maximumFractionDigits: 0,
});

/* [HELP:SPONSOR:UTILS:CLAMP] START — begræns tal mellem min/max */
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));
/* [HELP:SPONSOR:UTILS:CLAMP] END */

/* [HELP:SPONSOR:UTILS:ADDON-LABEL] START — prislabel for tilkøb */
function addonPriceLabel(a: AddOn) {
  if (a.monthly) return `${fmt.format(a.monthly)}/md.`;
  if (a.yearly) return `${fmt.format(a.yearly)}/år`;
  return "";
}
/* [HELP:SPONSOR:UTILS:ADDON-LABEL] END */

/* [HELP:SPONSOR:SHEET:MAP] START — map SPONSORPAKKER-rækker til Package */
function mapSheetRowToPackage(row: SheetRow): Package | null {
  const visible = isTruthyYes(row["visible"]);
  if (!visible) return null;

  const key =
    normalizeString(row["package_key"]) ||
    normalizeString(row["key"]) ||
    normalizeString(row["id"]);

  if (!key) return null;

  const name =
    row["package_title"] ||
    row["title"] ||
    row["badge_label"] ||
    key;

  const subtitle = row["subtitle"] || row["description"] || "";

  const badge = row["badge_label"] || row["ribbon_label"] || "";

  const priceAmountRaw = row["price_amount"] || row["price"] || "";
  const priceYear = Number(priceAmountRaw) || 0;

  const priceUnit =
    row["price_unit"] ||
    row["price_label"] ||
    "kr./år";

  const featuresRaw =
    row["features"] ||
    row["feature_list"] ||
    row["feature_text"] ||
    row["benefits"] ||
    "";

  const features = String(featuresRaw)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  let icon = normalizeString(row["icon"]);

  if (!icon) {
    const k = key.toLowerCase();
    if (k.includes("bronze")) icon = "🥉";
    else if (k.includes("sølv") || k.includes("solv") || k.includes("silver"))
      icon = "🥈";
    else if (k.includes("guld") || k.includes("gold")) icon = "🥇";
    else icon = "🎯";
  }

  const featured =
    isTruthyYes(row["featured"] || row["highlight"]) ||
    normalizeString(badge).toLowerCase() === "populær";

  return {
    key,
    name,
    icon,
    priceYear,
    badge,
    features,
    priceUnit,
    subtitle,
    featured,
  };
}
/* [HELP:SPONSOR:SHEET:MAP] END */

/* ======================================
   Komponent
   ====================================== */
/* [HELP:SPONSOR:COMPONENT] START
 * Pitch: Selve siden — state, beregninger og JSX-sektioner.
 * [HELP:SPONSOR:COMPONENT] END */
export default function SponsorPage() {
  /* [HELP:SPONSOR:STATE:PACKAGES] START — sponsorpakker fra Sheet */
  const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
  const [packagesLoaded, setPackagesLoaded] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/sheet?tab=${encodeURIComponent(
            SHEET_TAB_SPONSOR,
          )}&key=${encodeURIComponent(SHEET_KEY)}`,
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} – ${text}`);
        }
        const data = (await res.json()) as ApiListResponse;
        if (!data.ok || !data.items) {
          throw new Error(
            data.error || data.message || "Kunne ikke hente sponsorpakker.",
          );
        }

        const mapped = data.items
          .map(mapSheetRowToPackage)
          .filter((p): p is Package => !!p);

        mapped.sort((a, b) => {
          const ao = Number((a as any)["order"] ?? (a.featured ? 0 : 999));
          const bo = Number((b as any)["order"] ?? (b.featured ? 0 : 999));
          return ao - bo;
        });

        if (mapped.length) {
          setPackages(mapped);
        }
        setPackagesLoaded(true);
      } catch (err: any) {
        console.error("Fejl ved hentning af SPONSORPAKKER", err);
        setPackagesError(
          err?.message ||
            "Kunne ikke hente sponsorpakker. Viser fallback i stedet.",
        );
        setPackagesLoaded(true);
      }
    })();
  }, []);
  /* [HELP:SPONSOR:STATE:PACKAGES] END */

  /* [HELP:SPONSOR:STATE:BANE-LANES] START — optagede baner fra Sheet */
  const [takenLanes, setTakenLanes] = useState<number[]>(
    BANESPONSOR_TAKEN_LANES_FALLBACK,
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/sheet?tab=${encodeURIComponent(
            SHEET_TAB_BANESPONSOR_LANES,
          )}&key=${encodeURIComponent(SHEET_KEY)}`,
        );
        if (!res.ok) return;

        const data = (await res.json()) as ApiListResponse;
        if (!data.ok || !data.items?.length) return;

        const lanes = data.items
          .map((row) => {
            const laneRaw =
              row["bane"] ??
              row["lane"] ??
              row["nr"] ??
              row["id"] ??
              "";
            const lane = Number(laneRaw);
            if (!lane) return null;

            const taken = isTruthyYes(
              row["optaget"] ??
                row["taken"] ??
                row["occupied"] ??
                row["active"],
            );
            return taken ? lane : null;
          })
          .filter((v): v is number => v != null);

        if (lanes.length) {
          setTakenLanes(lanes);
        }
      } catch (err) {
        console.error("Fejl ved hentning af BANESPONSOR_BANER", err);
      }
    })();
  }, []);
  /* [HELP:SPONSOR:STATE:BANE-LANES] END */

  /* [HELP:SPONSOR:STATE:PACKAGE] START — valgt pakke (klik igen for at fjerne) */
  const [selected, setSelected] = useState<PackageKey | null>(null);
  /* [HELP:SPONSOR:STATE:PACKAGE] END */

  /* [HELP:SPONSOR:STATE:ONECLICK] START — ét-klik støtte (beløb + aktiv) */
  const [clickActive, setClickActive] = useState(false);
  const [clickAmount, setClickAmount] = useState<number>(500);
  const quick = [50, 100, 200, 500, 1000];
  /* [HELP:SPONSOR:STATE:ONECLICK] END */

  /* [HELP:SPONSOR:STATE:EARMARK] START — øremærkning + anonym toggle */
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
  /* [HELP:SPONSOR:STATE:EARMARK] END */

  /* [HELP:SPONSOR:STATE:ADDONS] START — valgte tilkøb (toggle) */
  const [selectedAddOns, setSelectedAddOns] = useState<
    Record<AddOnKey, boolean>
  >({
    youth: false,
    events: false,
    gear: false,
  });

  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  const toggleAddon = (k: AddOnKey) =>
    setSelectedAddOns((s) => {
      const next = !s[k];
      const updated = { ...s, [k]: next };
      if (k === BANESPONSOR_ADDON_KEY && !next) {
        setSelectedLane(null);
      }
      return updated;
    });

  const handleSelectLane = (lane: number) => {
    if (takenLanes.includes(lane)) return;

    setSelectedLane(lane);
    setSelectedAddOns((s) => ({
      ...s,
      [BANESPONSOR_ADDON_KEY]: true,
    }));
  };
  /* [HELP:SPONSOR:STATE:ADDONS] END */

  /* [HELP:SPONSOR:COMPUTE:BASE] START — pris for valgt pakke */
  const baseYear = useMemo(() => {
    const p = packages.find((x) => x.key === selected);
    return p ? p.priceYear : 0;
  }, [selected, packages]);
  /* [HELP:SPONSOR:COMPUTE:BASE] END */

  /* [HELP:SPONSOR:COMPUTE:ADDONS] START — tilkøbspriser (pr. år & pr. måned) */
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
  /* [HELP:SPONSOR:COMPUTE:ADDONS] END */

  /* [HELP:SPONSOR:COMPUTE:ONECLICK] START — ét-klik total (begrænset af min/max) */
  const oneClick = clickActive ? clamp(clickAmount, CLICK_MIN, CLICK_MAX) : 0;
  /* [HELP:SPONSOR:COMPUTE:ONECLICK] END */

  /* [HELP:SPONSOR:COMPUTE:TOTALS] START — samlet pris pr. år og måned */
  const totalYear = baseYear + addOnsYear + addOnsMonth * 12 + oneClick;
  const totalMonth = Math.round(totalYear / 12);
  /* [HELP:SPONSOR:COMPUTE:TOTALS] END */

  /* [HELP:SPONSOR:COMPUTE:EARMARK] START — liste over valgte øremærkninger */
  const earmarkList = Object.entries(tags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  /* [HELP:SPONSOR:COMPUTE:EARMARK] END */

  /* [HELP:SPONSOR:COMPUTE:READY] START — er noget valgt? (kan bruges til CTA) */
  const anyAddon = useMemo(
    () => Object.values(selectedAddOns).some(Boolean),
    [selectedAddOns],
  );

  const readyForForm = Boolean(selected || clickActive || anyAddon);
  /* [HELP:SPONSOR:COMPUTE:READY] END */

  /* [HELP:SPONSOR:SUMMARY:BUILD] START — kompakt tekst til opsummering */
  const buildSummaryText = () => {
    const selectedPkg = packages.find((x) => x.key === selected) ?? null;
    const chosenAddons = ADDONS.filter((a) => selectedAddOns[a.key]);

    const lines: string[] = [];

    if (selectedPkg) {
      lines.push(
        `Pakke: ${selectedPkg.name} (${fmt.format(selectedPkg.priceYear)}/år)`,
      );
    } else {
      lines.push("Pakke: (ingen valgt)");
    }

    if (chosenAddons.length) {
      lines.push("");
      lines.push("Tilkøb:");
      chosenAddons.forEach((a) => {
        let label = `${a.name}`;
        const price = addonPriceLabel(a);
        if (price) label += ` (${price})`;

        if (a.key === BANESPONSOR_ADDON_KEY && selectedLane != null) {
          label += ` – ønsket bane: ${selectedLane}`;
        }

        lines.push(`  • ${label}`);
      });
    }

    if (clickActive) {
      lines.push("");
      lines.push(`Ét-klik støtte: ${fmt.format(oneClick)} (engang)`);
      if (clickAnon) lines.push("  • Anonym støtte: JA");
      if (earmarkList.length) {
        lines.push(
          `  • Ønsket anvendelse: ${earmarkList.join(", ")}`,
        );
      }
    }

    lines.push("");
    lines.push("----------------------------------");
    lines.push(`I alt pr. år:    ${fmt.format(totalYear)}`);
    lines.push(`Ca. pr. måned:  ${fmt.format(totalMonth)}`);
    lines.push("");
    lines.push("Tak for at støtte Humlum Dartklub – Fællesskab & Præcision.");

    return lines.join("\n");
  };
  /* [HELP:SPONSOR:SUMMARY:BUILD] END */

  /* [HELP:SPONSOR:SUMMARY:ACTIONS] START — download / mail / form knappernes logik */
  const SPONSOR_AGREEMENT_PDF = "/docs/HDK_Sponsoraftale.pdf";
  const BANESPONSOR_AGREEMENT_PDF = "/docs/HDK_Banesponsor_aftale.pdf";

  const CLUB_EMAIL = "humlumdartklub@gmail.com";

  const SPONSOR_SELECTION_STORAGE_KEY = "hdk:sponsor:selection:v1";

  const buildSelectionPayload = () => {
    const p = packages.find((x) => x.key === selected) ?? null;

    const chosenAddons = ADDONS.filter((a) => selectedAddOns[a.key]).map(
      (a) => ({
        key: a.key,
        name: a.name,
        monthly: a.monthly ?? null,
        yearly: a.yearly ?? null,
        ...(a.key === BANESPONSOR_ADDON_KEY && selectedLane != null
          ? { lane: selectedLane }
          : {}),
      }),
    );

    const oneClickPayload = clickActive
      ? {
          amount: oneClick,
          anonymous: clickAnon,
          earmarks: earmarkList,
        }
      : null;

    const summaryText = buildSummaryText();

    return {
      package: p
        ? { key: p.key, name: p.name, priceYear: p.priceYear }
        : null,
      addOns: chosenAddons,
      oneClick: oneClickPayload,
      totals: { year: totalYear, month: totalMonth },
      summaryText,
      createdAt: new Date().toISOString(),
    };
  };

  const handleMail = () => {
    const body = encodeURIComponent(buildSummaryText());
    const subject = encodeURIComponent(
      "Sponsoropsummering - Humlum Dartklub",
    );
    window.location.href = `mailto:${CLUB_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleOpenForm = () => {
    const payload = buildSelectionPayload();

    try {
      localStorage.setItem(
        SPONSOR_SELECTION_STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch {
      // ignore storage errors
    }

    const qs = new URLSearchParams();

    if (payload.summaryText) qs.set("prefill", payload.summaryText);
    if (payload.package?.name) qs.set("pkg", payload.package.name);

    if (payload.addOns?.length) {
      qs.set(
        "addons",
        payload.addOns.map((a) => a.name).join(", "),
      );
    }

    if (payload.oneClick?.amount) {
      qs.set("click", String(payload.oneClick.amount));
      if (payload.oneClick.anonymous) qs.set("anon", "1");
      if (payload.oneClick.earmarks?.length) {
        qs.set("earmarks", payload.oneClick.earmarks.join(", "));
      }
    }

    qs.set("totalYear", String(payload.totals.year));

    window.location.href = `${SPONSOR_FORM_HREF}?${qs.toString()}`;
  };
  /* [HELP:SPONSOR:SUMMARY:ACTIONS] END */

  /* ======================================
     UI
     ====================================== */

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* [HELP:SPONSOR:SECTION:INTRO] START — sideintro (kicker, titel, undertekst) */}
      <section className="section-header">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          SPONSORER
        </div>
        <h1 className="section-title">Støt Humlum Dartklub</h1>
        <div className="section-underline" />
        <p className="section-subtitle">
          Vælg en pakke og/eller støt med et valgfrit beløb. Du kan downloade
          aftalerne, sende en opsummering som e-mail eller udfylde sponsor-skemaet.
        </p>

        {packagesError && (
          <p className="mt-2 text-xs text-red-600">
            {packagesError}
          </p>
        )}
      </section>
      {/* [HELP:SPONSOR:SECTION:INTRO] END */}

      {/* [HELP:SPONSOR:SECTION:PACKAGES] START — pakker + ét-klik støtte i samme grid */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          PAKKER &amp; ÉT-KLIK STØTTE
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {packages.map((p) => {
            const isSel = selected === p.key;
            return (
              <div
                key={p.key}
                className={[
                  "h-full rounded-3xl border bg-white p-6 shadow-md transition",
                  "border-slate-200 hover:shadow-lg hover:-translate-y-0.5",
                  isSel ? "ring-2 ring-orange-300/70" : "",
                  "flex flex-col",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    <span className="mr-2">{p.icon}</span>
                    {p.name}
                  </h3>
                  {p.badge && (
                    <span className="rounded-full border border-slate-200/60 bg-orange-50 px-2 py-0.5 text-xs text-gray-700">
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-2xl font-extrabold text-gray-900">
                  {fmt.format(p.priceYear)}{" "}
                  <span className="text-sm font-normal opacity-70">
                    /år
                  </span>
                </p>

                {p.subtitle && (
                  <p className="mt-1 text-xs text-gray-600">{p.subtitle}</p>
                )}

                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 min-h-[96px]">
                  {p.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setSelected(isSel ? null : p.key)}
                  className="mt-auto w-full btn btn-primary"
                >
                  {isSel ? "Fjern pakke" : "Vælg pakke"}
                </button>
              </div>
            );
          })}

          {/* [HELP:SPONSOR:ONECLICK] START — kortet “Støt med ét klik” */}
          <div
            className={[
              "h-full text-left rounded-3xl border p-6 shadow-md transition",
              "border-slate-200 hover:shadow-lg hover:-translate-y-0.5",
              clickActive ? "ring-2 ring-orange-300/70" : "",
              "bg-white flex flex-col",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">💚 Støt med ét klik</h3>
              <span className="text-xs opacity-70">
                {fmt0.format(clickActive ? clickAmount : 0)} kr. engang
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={[
                    "rounded-full border px-3 py-1 text-sm",
                    q === clickAmount
                      ? "border-slate-200 bg-orange-50"
                      : "border-slate-200 bg-white hover:bg-orange-50",
                  ].join(" ")}
                  onClick={() => {
                    setClickAmount(q);
                    setClickActive(true);
                  }}
                >
                  {fmt0.format(q)} kr
                </button>
              ))}
            </div>

            <div className="mt-3">
              <label className="text-sm">Beløb</label>
              <input
                className="input-light mt-1 w-full"
                type="number"
                min={CLICK_MIN}
                max={CLICK_MAX}
                value={clickAmount}
                onChange={(e) =>
                  setClickAmount(
                    clamp(
                      Number(e.target.value || 0),
                      CLICK_MIN,
                      CLICK_MAX,
                    ),
                  )
                }
                onFocus={() => setClickActive(true)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Min {CLICK_MIN} kr · Max {fmt0.format(CLICK_MAX)} kr. Større
                beløb? Skriv – vi kontakter dig diskret.
              </p>
            </div>

            <details className="mt-3 rounded-xl border border-slate-200/60 bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm">
                Øremærkning (valgfrit)
              </summary>
              <div className="mt-3 space-y-2 text-sm text-gray-800">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clickAnon}
                    onChange={() => setClickAnon(!clickAnon)}
                  />
                  Anonym støtte
                </label>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tags.dartskive}
                      onChange={() => toggleTag("dartskive")}
                    />
                    Dartskive
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tags.udstyr}
                      onChange={() => toggleTag("udstyr")}
                    />
                    Udstyr
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tags.ungdom}
                      onChange={() => toggleTag("ungdom")}
                    />
                    Ungdom
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tags.arrangementer}
                      onChange={() => toggleTag("arrangementer")}
                    />
                    Arrangementer
                  </label>
                  <label className="inline-flex items-center gap-2 col-span-2">
                    <input
                      type="checkbox"
                      checked={tags.drift}
                      onChange={() => toggleTag("drift")}
                    />
                    Generel drift
                  </label>
                </div>
              </div>
            </details>

            <button
              type="button"
              onClick={() => setClickActive(!clickActive)}
              className="mt-auto w-full btn btn-primary"
            >
              {clickActive ? "Fjern støtte" : "Tilføj støtte"}
            </button>
          </div>
          {/* [HELP:SPONSOR:ONECLICK] END */}
        </div>
      </section>
      {/* [HELP:SPONSOR:SECTION:PACKAGES] END */}

      {/* [HELP:SPONSOR:SECTION:ADDONS] START — tilkøbsgrid */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          TILKØB
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((a) => {
            const active = !!selectedAddOns[a.key];
            const isBane = a.key === BANESPONSOR_ADDON_KEY;
            return (
              <div
                key={a.key}
                className={[
                  "h-full text-left rounded-3xl border p-4 shadow-md transition",
                  "border-slate-200 hover:shadow-lg hover:-translate-y-0.5",
                  active ? "ring-2 ring-orange-300/70" : "",
                  "bg-white flex flex-col",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-900">
                    <span className="mr-2">{a.icon}</span>
                    {a.name}
                  </h4>
                  <span className="text-sm text-gray-700">
                    {addonPriceLabel(a)}
                  </span>
                </div>

                {a.hint && !isBane && (
                  <p className="mt-2 text-sm text-gray-600">{a.hint}</p>
                )}

                {isBane && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-orange-50/60 p-3">
                    <p className="text-xs font-semibold text-gray-800">
                      Ønsket bane
                    </p>
                    <p className="mt-1 text-xs text-gray-700">
                      Vælg hvilken bane I primært ønsker at støtte. Antal baner
                      og endelig aftale fastlægges sammen med klubben.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {BANESPONSOR_LANES.map((lane) => {
                        const laneActive = selectedLane === lane;
                        const laneTaken = takenLanes.includes(lane);
                        return (
                          <button
                            key={lane}
                            type="button"
                            disabled={laneTaken}
                            onClick={() => handleSelectLane(lane)}
                            className={[
                              "rounded-full px-3 py-1 text-xs border",
                              laneTaken
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                                : laneActive
                                  ? "bg-orange-500 text-white border-slate-200"
                                  : "bg-white text-gray-800 border-slate-200 hover:bg-orange-50",
                            ].join(" ")}
                          >
                            {`Bane ${lane}${laneTaken ? " (optaget)" : ""}`}
                          </button>
                        );
                      })}
                    </div>
                    {selectedLane != null && active && (
                      <p className="mt-2 text-[11px] text-gray-700">
                        Valgt bane:{" "}
                        <span className="font-semibold">
                          Bane {selectedLane}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAddon(a.key)}
                    className="w-full btn btn-primary"
                  >
                    {active ? "Fjern tilkøb" : "Vælg tilkøb"}
                  </button>
                  {/* Banesponsor-aftale PDF-link er flyttet til opsummeringsfeltet nederst */}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* [HELP:SPONSOR:SECTION:ADDONS] END */}

      {/* [HELP:SPONSOR:SECTION:SUMMARY] START — opsummering & CTA */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="kicker">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          OPSUMMERING &amp; NÆSTE SKRIDT
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[2fr,1fr] items-start">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Din nuværende opsætning
            </h3>
            <pre className="mt-2 whitespace-pre-wrap rounded-2xl bg-gray-50 p-4 text-xs font-mono text-gray-800">
              {buildSummaryText()}
            </pre>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-orange-50 p-4 text-sm text-gray-900">
              <p className="font-semibold">Økonomi (estimat)</p>
              <p className="mt-1">
                Årligt samlet:{" "}
                <span className="font-bold">{fmt.format(totalYear)}</span>
              </p>
              <p>
                Ca. pr. måned:{" "}
                <span className="font-bold">{fmt.format(totalMonth)}</span>
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <a
                href={SPONSOR_AGREEMENT_PDF}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary text-center"
              >
                Download sponsoraftale (PDF)
              </a>

              <a
                href={BANESPONSOR_AGREEMENT_PDF}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary text-center"
              >
                Download banesponsor-aftale (PDF)
              </a>

              <button
                type="button"
                onClick={handleMail}
                className="btn btn-secondary text-center"
              >
                Send opsummering som e-mail
              </button>

              <button
                type="button"
                onClick={handleOpenForm}
                disabled={!readyForForm}
                className={`btn btn-primary text-center ${
                  !readyForForm ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                Udfyld sponsor-skema
              </button>

              {!readyForForm && (
                <p className="text-[11px] text-gray-600">
                  Vælg mindst én pakke, et tilkøb eller ét-klik støtte, før du
                  går videre til sponsor-skemaet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* [HELP:SPONSOR:SECTION:SUMMARY] END */}
    </main>
  );
}
