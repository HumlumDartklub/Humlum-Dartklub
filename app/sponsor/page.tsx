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
const SHEET_TAB_ADDONS = "SPONSOR_TILKOEB";

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

type AddOnKey = string;

type AddOn = {
  key: AddOnKey;
  name: string;
  icon: string;
  monthly?: number;
  yearly?: number;
  hint?: string;
  order?: number;
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
 * Pitch: Fallback-tilkøb. Hvis SPONSOR_TILKOEB kan læses, styrer arket visningen.
 * [HELP:SPONSOR:ADDONS:DATA] END */
const ADDONS_FALLBACK: AddOn[] = [
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
const BANESPONSOR_LANES: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

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

/* [HELP:SPONSOR:SHEET:MAP_ADDONS] START — map SPONSOR_TILKOEB-rækker til AddOn */
function isBanesponsorAddonKey(key: string, name?: string): boolean {
  const v = `${key} ${name || ""}`.toLowerCase();
  return v.includes("bane") || v.includes("udstyr") || v.includes("gear");
}

function mapSheetRowToAddOn(row: SheetRow): AddOn | null {
  const visible = isTruthyYes(row["visible"]);
  if (!visible) return null;

  const key = normalizeString(row["key"] || row["id"] || row["addon_key"]);
  if (!key) return null;

  const name = normalizeString(row["title"] || row["name"] || row["label"] || key);
  const unit = normalizeString(row["price_unit"] || row["unit"] || "kr./år").toLowerCase();
  const amount = Number(row["price_amount"] || row["price"] || 0) || 0;

  const addOn: AddOn = {
    key,
    name,
    icon: normalizeString(row["icon"]) || (isBanesponsorAddonKey(key, name) ? "🎯" : key.toLowerCase().includes("udvid") ? "🏗️" : "🤝"),
    hint: normalizeString(row["features"] || row["hint"] || row["description"]),
    order: Number(row["order"] || 999),
  };

  if (unit.includes("md") || unit.includes("måned") || unit.includes("maaned")) addOn.monthly = amount;
  else addOn.yearly = amount;

  return addOn;
}

function isExpansionAddonKey(key: string, name?: string): boolean {
  const v = `${key} ${name || ""}`.toLowerCase();
  return (
    v.includes("udvid") ||
    v.includes("fundraising") ||
    v.includes("fremtid") ||
    v.includes("lokale")
  );
}

function filterVisibleAddOns(addOns: AddOn[]): AddOn[] {
  return addOns.filter((a) => !isExpansionAddonKey(a.key, a.name));
}

/* [HELP:SPONSOR:SHEET:MAP_ADDONS] END */

/* [HELP:SPONSOR:EXPANSION:CONFIG] START — fundraising-kort + plan-popup */
const EXPANSION_PLAN_IMAGES = [
  {
    src: "/images/koncept/hdk-udvidelse-perspektiv.jpg",
    alt: "Perspektivskitse af udvidet Humlum Dartklub med 12 baner",
  },
  {
    src: "/images/koncept/hdk-udvidelse-koncept.jpg",
    alt: "Konceptskitse for moderniseret klubrum i gymnastiksalen",
  },
];

const EXPANSION_QUICK_AMOUNTS = [250, 500, 1000, 2500, 5000, 10000];

const EXPANSION_PURPOSES = [
  "Nye dartbaner 7–12",
  "Paradart & tilgængelighed",
  "Ungdom & prøvepile",
  "Digital scoring / skærme",
  "Lys, akustik & materialer",
  "Lounge & klubmiljø",
  "Generel støtte",
];
/* [HELP:SPONSOR:EXPANSION:CONFIG] END */

/* [HELP:SPONSOR:MOBILEPAY:CONFIG] START — betaling via MobilePay */
const MOBILEPAY_NUMBER = "97035";
const MOBILEPAY_NAME = "Humlum Dartklub";
const MOBILEPAY_QR_SRC = "/images/mobilepay/hdk-mobilepay-97035.jpg";
/* [HELP:SPONSOR:MOBILEPAY:CONFIG] END */
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

  /* [HELP:SPONSOR:STATE:ADDONS_FROM_SHEET] START — tilkøb + fundraising styres fra Sheet */
  const [addOns, setAddOns] = useState<AddOn[]>(filterVisibleAddOns(ADDONS_FALLBACK));
  const banesponsorAddonKey = useMemo(
    () => addOns.find((a) => isBanesponsorAddonKey(a.key, a.name))?.key || BANESPONSOR_ADDON_KEY,
    [addOns],
  );
  /* [HELP:SPONSOR:STATE:ADDONS_FROM_SHEET] END */

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

  /* [HELP:SPONSOR:STATE:ADDONS_FETCH] START — SPONSOR_TILKOEB bliver til kort på siden */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/sheet?tab=${encodeURIComponent(SHEET_TAB_ADDONS)}&key=${encodeURIComponent(SHEET_KEY)}`,
        );
        if (!res.ok) return;

        const data = (await res.json()) as ApiListResponse;
        if (!data.ok || !data.items?.length) return;

        const mapped = data.items
          .map(mapSheetRowToAddOn)
          .filter((a): a is AddOn => !!a)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        if (mapped.length) setAddOns(filterVisibleAddOns(mapped));
      } catch (err) {
        console.error("Fejl ved hentning af SPONSOR_TILKOEB", err);
      }
    })();
  }, []);
  /* [HELP:SPONSOR:STATE:ADDONS_FETCH] END */

  /* [HELP:SPONSOR:STATE:BANE-LANES] START — optagede baner fra Sheet */
  const [laneOptions, setLaneOptions] = useState<number[]>(BANESPONSOR_LANES);
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

        const parsed = data.items
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
            return { lane, taken };
          })
          .filter((v): v is { lane: number; taken: boolean } => v != null);

        const allLanes = parsed.map((x) => x.lane).sort((a, b) => a - b);
        const taken = parsed.filter((x) => x.taken).map((x) => x.lane);

        if (allLanes.length) setLaneOptions(allLanes);
        setTakenLanes(taken);
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

  /* [HELP:SPONSOR:STATE:EXPANSION] START — fundraising til udvidelse */
  const [expansionActive, setExpansionActive] = useState(false);
  const [expansionAmount, setExpansionAmount] = useState<number>(1000);
  const [expansionPurpose, setExpansionPurpose] = useState<string>(
    EXPANSION_PURPOSES[0],
  );
  const [plansOpen, setPlansOpen] = useState(false);
  /* [HELP:SPONSOR:STATE:EXPANSION] END */

  /* [HELP:SPONSOR:STATE:MOBILEPAY] START — feedback + stor scan-popup */
  const [copiedPaymentNote, setCopiedPaymentNote] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  /* [HELP:SPONSOR:STATE:MOBILEPAY] END */

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
  >({});

  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  const toggleAddon = (k: AddOnKey) =>
    setSelectedAddOns((s) => {
      const next = !s[k];
      const updated = { ...s, [k]: next };
      if (isBanesponsorAddonKey(k) && !next) {
        setSelectedLane(null);
      }
      return updated;
    });

  const handleSelectLane = (lane: number) => {
    if (takenLanes.includes(lane)) return;

    setSelectedLane(lane);
    setSelectedAddOns((s) => ({
      ...s,
      [banesponsorAddonKey]: true,
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
    addOns.forEach((a) => {
      if (selectedAddOns[a.key] && a.yearly) y += a.yearly;
    });
    return y;
  }, [selectedAddOns, addOns]);

  const addOnsMonth = useMemo(() => {
    let m = 0;
    addOns.forEach((a) => {
      if (selectedAddOns[a.key] && a.monthly) m += a.monthly;
    });
    return m;
  }, [selectedAddOns, addOns]);
  /* [HELP:SPONSOR:COMPUTE:ADDONS] END */

  /* [HELP:SPONSOR:COMPUTE:ONECLICK] START — ét-klik total (begrænset af min/max) */
  const oneClick = clickActive ? clamp(clickAmount, CLICK_MIN, CLICK_MAX) : 0;
  /* [HELP:SPONSOR:COMPUTE:ONECLICK] END */

  /* [HELP:SPONSOR:COMPUTE:EXPANSION] START — valgfri udvidelsesstøtte */
  const expansionSupport = expansionActive
    ? clamp(expansionAmount, CLICK_MIN, CLICK_MAX)
    : 0;
  /* [HELP:SPONSOR:COMPUTE:EXPANSION] END */

  /* [HELP:SPONSOR:COMPUTE:TOTALS] START — samlet pris pr. år og måned */
  const totalYear = baseYear + addOnsYear + addOnsMonth * 12 + oneClick + expansionSupport;
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

  const readyForForm = Boolean(selected || clickActive || expansionActive || anyAddon);
  /* [HELP:SPONSOR:COMPUTE:READY] END */

  /* [HELP:SPONSOR:MOBILEPAY:REFERENCE] START — kort note til MobilePay-kommentar */
  const buildPaymentNote = () => {
    const selectedPkg = packages.find((x) => x.key === selected) ?? null;
    const chosenAddons = addOns.filter((a) => selectedAddOns[a.key]);
    const parts: string[] = [];

    if (selectedPkg) parts.push(selectedPkg.name);

    const baneAddon = chosenAddons.find((a) =>
      isBanesponsorAddonKey(a.key, a.name),
    );
    if (baneAddon) {
      parts.push(selectedLane ? `Banesponsor B${selectedLane}` : "Banesponsor");
    }

    chosenAddons
      .filter((a) => !isBanesponsorAddonKey(a.key, a.name))
      .forEach((a) => parts.push(a.name));

    if (expansionActive) parts.push(`Udvidelse: ${expansionPurpose}`);

    if (clickActive) {
      const earmark = earmarkList.length ? earmarkList.join("+") : "generel";
      parts.push(`Støtte: ${earmark}`);
    }

    const note = `HDK Sponsor - ${parts.length ? parts.join(" - ") : "støtte"}`;
    return note.length > 95 ? `${note.slice(0, 92)}...` : note;
  };
  /* [HELP:SPONSOR:MOBILEPAY:REFERENCE] END */

  /* [HELP:SPONSOR:SUMMARY:BUILD] START — kompakt tekst til opsummering */
  const buildSummaryText = () => {
    const selectedPkg = packages.find((x) => x.key === selected) ?? null;
    const chosenAddons = addOns.filter((a) => selectedAddOns[a.key]);

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

        if (isBanesponsorAddonKey(a.key, a.name) && selectedLane != null) {
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

    if (expansionActive) {
      lines.push("");
      lines.push(`Udvidelsesstøtte: ${fmt.format(expansionSupport)} (engang)`);
      lines.push(`  • Ønsket støtteområde: ${expansionPurpose}`);
    }

    lines.push("");
    lines.push("----------------------------------");
    lines.push(`I alt pr. år:    ${fmt.format(totalYear)}`);
    lines.push(`Ca. pr. måned:  ${fmt.format(totalMonth)}`);
    lines.push("");
    lines.push(`Betaling via MobilePay: #${MOBILEPAY_NUMBER} (${MOBILEPAY_NAME})`);
    lines.push(`Betalingsnote: ${buildPaymentNote()}`);
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

    const chosenAddons = addOns.filter((a) => selectedAddOns[a.key]).map(
      (a) => ({
        key: a.key,
        name: a.name,
        monthly: a.monthly ?? null,
        yearly: a.yearly ?? null,
        ...(isBanesponsorAddonKey(a.key, a.name) && selectedLane != null
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

    const expansionPayload = expansionActive
      ? {
          amount: expansionSupport,
          purpose: expansionPurpose,
        }
      : null;

    const summaryText = buildSummaryText();

    return {
      package: p
        ? { key: p.key, name: p.name, priceYear: p.priceYear }
        : null,
      addOns: chosenAddons,
      oneClick: oneClickPayload,
      expansion: expansionPayload,
      totals: { year: totalYear, month: totalMonth },
      payment: {
        method: "MobilePay",
        number: MOBILEPAY_NUMBER,
        name: MOBILEPAY_NAME,
        note: buildPaymentNote(),
      },
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

    if (payload.expansion?.amount) {
      qs.set("expansion", String(payload.expansion.amount));
      qs.set("expansionPurpose", payload.expansion.purpose);
    }

    qs.set("totalYear", String(payload.totals.year));
    qs.set("mobilepay", MOBILEPAY_NUMBER);
    qs.set("paymentNote", payload.payment.note);

    window.location.href = `${SPONSOR_FORM_HREF}?${qs.toString()}`;
  };

  const copyPaymentNote = async () => {
    const note = buildPaymentNote();

    try {
      await navigator.clipboard.writeText(note);
      setCopiedPaymentNote(true);
      window.setTimeout(() => setCopiedPaymentNote(false), 1600);
    } catch {
      window.prompt("Kopiér betalingsnote", note);
    }
  };

  const openScanPayment = () => {
    if (!readyForForm && !expansionActive) {
      setExpansionActive(true);
    }
    setScanOpen(true);
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


          {/* [HELP:SPONSOR:EXPANSION_CARD] START — fundraising placeret ved siden af ét-klik støtte */}
          <div
            className={[
              "h-full text-left rounded-3xl border p-6 shadow-md transition lg:col-span-2",
              "border-slate-200 hover:shadow-lg hover:-translate-y-0.5",
              expansionActive ? "ring-2 ring-orange-300/70" : "",
              "bg-gradient-to-br from-orange-50 via-white to-blue-50 flex flex-col",
            ].join(" ")}
          >
            <div className="grid gap-5 md:grid-cols-[1.35fr,0.95fr] items-stretch">
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
                      Fundraising · fremtidens klubrum
                    </p>
                    <h3 className="mt-1 text-xl font-extrabold text-gray-950">
                      🏗️ Støt udvidelsen
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700">
                      Hjælp os med at skabe et stærkere klubmiljø med op til 12 baner,
                      paradart, ungdom, digital scoring og bedre rammer for events.
                    </p>
                  </div>
                  <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800">
                    Valgfrit beløb
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {EXPANSION_QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={[
                        "rounded-full border px-3 py-1 text-sm",
                        q === expansionAmount
                          ? "border-orange-200 bg-orange-100 text-gray-950"
                          : "border-slate-200 bg-white hover:bg-orange-50",
                      ].join(" ")}
                      onClick={() => {
                        setExpansionAmount(q);
                        setExpansionActive(true);
                      }}
                    >
                      {fmt0.format(q)} kr
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[180px,1fr]">
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Valgfrit beløb
                    </label>
                    <input
                      className="input-light mt-1 w-full"
                      type="number"
                      min={CLICK_MIN}
                      max={CLICK_MAX}
                      value={expansionAmount}
                      onChange={(e) =>
                        setExpansionAmount(
                          clamp(
                            Number(e.target.value || 0),
                            CLICK_MIN,
                            CLICK_MAX,
                          ),
                        )
                      }
                      onFocus={() => setExpansionActive(true)}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Hvad vil I helst støtte?
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {EXPANSION_PURPOSES.map((purpose) => (
                        <button
                          key={purpose}
                          type="button"
                          onClick={() => {
                            setExpansionPurpose(purpose);
                            setExpansionActive(true);
                          }}
                          className={[
                            "rounded-full border px-3 py-1 text-xs",
                            expansionPurpose === purpose
                              ? "border-orange-200 bg-orange-500 text-white"
                              : "border-slate-200 bg-white text-gray-800 hover:bg-orange-50",
                          ].join(" ")}
                        >
                          {purpose}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setPlansOpen(true)}
                    className="btn btn-secondary"
                  >
                    Se planerne
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpansionActive(!expansionActive)}
                    className="btn btn-primary"
                  >
                    {expansionActive ? "Fjern støtte" : "Tilføj støtte"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpansionActive(true);
                      setScanOpen(true);
                    }}
                    className="rounded-full border border-blue-200 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    📱 Scan &amp; betal
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPlansOpen(true)}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm"
                aria-label="Åbn planerne for udvidelsen"
              >
                <img
                  src={EXPANSION_PLAN_IMAGES[0].src}
                  alt={EXPANSION_PLAN_IMAGES[0].alt}
                  className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="p-3 text-xs text-gray-700">
                  <span className="font-semibold text-gray-950">Plan: 12 baner</span>
                  <span className="block">Klik for skitser, idé og nøglepunkter.</span>
                </div>
              </button>
            </div>
          </div>
          {/* [HELP:SPONSOR:EXPANSION_CARD] END */}
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
          {addOns.map((a) => {
            const active = !!selectedAddOns[a.key];
            const isBane = isBanesponsorAddonKey(a.key, a.name);
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
                      {laneOptions.map((lane) => {
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

            {/* [HELP:SPONSOR:MOBILEPAY_CARD] START — synlig betaling via MobilePay */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-gray-900 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[150px,1fr]">
                <button
                  type="button"
                  onClick={() => setScanOpen(true)}
                  className="group rounded-2xl border border-blue-100 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  aria-label="Åbn stor MobilePay QR-kode"
                >
                  <img
                    src={MOBILEPAY_QR_SRC}
                    alt={`MobilePay QR-kode til ${MOBILEPAY_NAME} #${MOBILEPAY_NUMBER}`}
                    className="mx-auto h-44 w-full rounded-xl object-contain"
                  />
                  <span className="mt-2 block rounded-full bg-blue-600 px-3 py-1.5 text-center text-xs font-bold text-white group-hover:bg-blue-700">
                    Klik · Scan mig
                  </span>
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                    Betaling
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-gray-950">
                    MobilePay #{MOBILEPAY_NUMBER}
                  </p>
                  <p className="text-xs text-gray-600">{MOBILEPAY_NAME}</p>
                  <p className="mt-3 text-xs leading-relaxed text-gray-700">
                    Klik på QR-koden for en stor scan-visning. På telefon kan man
                    også søge på nummeret i MobilePay. Husk betalingsnoten, så vi
                    kan matche betalingen.
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setScanOpen(true)}
                      className="rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Åbn Scan mig
                    </button>
                    <button
                      type="button"
                      onClick={copyPaymentNote}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-blue-50"
                    >
                      {copiedPaymentNote ? "Kopieret ✓" : "Kopiér note"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Betalingsnote
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-gray-950">
                  {buildPaymentNote()}
                </p>
              </div>
            </div>
            {/* [HELP:SPONSOR:MOBILEPAY_CARD] END */}

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

      {/* [HELP:SPONSOR:MOBILEPAY_SCAN_MODAL] START — stor scan-visning til MobilePay */}
      {scanOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Scan mig
                </p>
                <h3 className="text-xl font-extrabold text-gray-950">
                  Betal via MobilePay
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScanOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Luk
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">{MOBILEPAY_NAME}</p>
                <p className="text-3xl font-black text-blue-700">#{MOBILEPAY_NUMBER}</p>
                <div className="mt-4 rounded-3xl bg-white p-3 shadow-inner">
                  <img
                    src={MOBILEPAY_QR_SRC}
                    alt={`Stor MobilePay QR-kode til ${MOBILEPAY_NAME} #${MOBILEPAY_NUMBER}`}
                    className="mx-auto max-h-[68vh] w-full max-w-[420px] object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center rounded-3xl bg-orange-50/70 p-5 text-sm text-gray-800">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                  Betalingsdetaljer
                </p>
                <h4 className="mt-1 text-lg font-extrabold text-gray-950">
                  Scan QR-koden eller søg på #{MOBILEPAY_NUMBER}
                </h4>
                <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Betalingsnote
                  </p>
                  <p className="mt-1 break-words text-base font-extrabold text-gray-950">
                    {buildPaymentNote()}
                  </p>
                  <button
                    type="button"
                    onClick={copyPaymentNote}
                    className="mt-4 w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    {copiedPaymentNote ? "Betalingsnote kopieret ✓" : "Kopiér betalingsnote"}
                  </button>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-gray-700">
                  Skriv betalingsnoten i kommentarfeltet i MobilePay. Så kan klubben
                  nemt se, om betalingen gælder sponsor, udvidelse, banesponsor eller
                  anden støtte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* [HELP:SPONSOR:MOBILEPAY_SCAN_MODAL] END */}

      {/* [HELP:SPONSOR:EXPANSION_MODAL] START — lille vindue med planer */}
      {plansOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/40 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
                  Udvidelsesplan
                </p>
                <h3 className="text-xl font-extrabold text-gray-950">
                  Humlum Dartklub · 12 baner og stærkere fællesskab
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPlansOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Luk
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="space-y-4">
                {EXPANSION_PLAN_IMAGES.map((image) => (
                  <img
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    className="w-full rounded-3xl border border-slate-200 object-cover shadow-sm"
                  />
                ))}
              </div>

              <div className="rounded-3xl bg-orange-50/70 p-5 text-sm text-gray-800">
                <h4 className="text-lg font-extrabold text-gray-950">
                  Hvad går støtten til?
                </h4>
                <p className="mt-2 leading-relaxed">
                  Projektet handler om at gøre klubmiljøet mere fleksibelt, tilgængeligt
                  og brugbart for både dart, ungdom, paradart, events og sociale aktiviteter.
                </p>

                <ul className="mt-4 space-y-3">
                  <li>🎯 Op til 12 dartbaner inkl. plads til paradart.</li>
                  <li>📺 Digital scoring, skærme og tydelig klubinfo.</li>
                  <li>💡 Bedre lys, akustik og robuste materialer.</li>
                  <li>☕ Lounge, hyggezone og multifunktionelt klubmiljø.</li>
                  <li>🤝 Et stærkt lokalt samlingspunkt — også uden for banen.</li>
                </ul>

                <div className="mt-5 rounded-2xl border border-orange-200 bg-white p-4">
                  <p className="font-semibold text-gray-950">Valgt støtte</p>
                  <p className="mt-1">
                    {fmt.format(expansionAmount)} · {expansionPurpose}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="grid gap-3 sm:grid-cols-[110px,1fr]">
                    <button
                      type="button"
                      onClick={() => setScanOpen(true)}
                      className="rounded-xl border border-blue-100 bg-blue-50 p-2 text-center shadow-sm hover:bg-blue-100"
                    >
                      <img
                        src={MOBILEPAY_QR_SRC}
                        alt={`MobilePay QR-kode til ${MOBILEPAY_NAME} #${MOBILEPAY_NUMBER}`}
                        className="mx-auto h-28 w-full rounded-lg object-contain"
                      />
                      <span className="mt-1 block text-[11px] font-bold text-blue-700">
                        Scan mig
                      </span>
                    </button>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                        Betal nemt
                      </p>
                      <p className="mt-1 font-extrabold text-gray-950">
                        MobilePay #{MOBILEPAY_NUMBER}
                      </p>
                      <p className="mt-2 text-xs text-gray-700">
                        Brug gerne note: <span className="font-semibold">{buildPaymentNote()}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setScanOpen(true)}
                        className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        Åbn stor QR-kode
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpansionActive(true);
                      setPlansOpen(false);
                    }}
                    className="btn btn-primary"
                  >
                    Tilføj støtte til udvidelsen
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlansOpen(false)}
                    className="btn btn-secondary"
                  >
                    Tilbage til sponsorvalg
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* [HELP:SPONSOR:EXPANSION_MODAL] END */}
    </main>
  );
}
