/* [FORSIDE:DATA:IMPORTS] START */
/* [FORSIDE:DATA:IMPORTS] END */
// lib/getForsideData.ts

/* [FORSIDE:DATA:TYPES] START */
export type SheetItem = {
  id?: string;
  title?: string;
  body?: string;
  body_md?: string;
  image?: string;
  status?: string;
  visible?: string; // "YES"/"NO"
  order?: number;
  start_on?: string;
  end_on?: string;
  channel?: string; // "PUBLIC"/"INTERNAL"/...
  link?: string;
  pin?: string;
  date?: string;
};

export type SheetMap = {
/* [FORSIDE:DATA:TYPES] END */
  FORSIDE?: SheetItem[];
  NYHEDER?: SheetItem[];
  TICKER?: { message: string; title?: string; pin?: string; date?: string; order?: number; start_on?: string; end_on?: string; channel?: string }[];
  [key: string]: any;
};

// Hjælpere
type SheetApiResponse =
  | { ok?: boolean; rows?: any[]; items?: any[]; itemsNormalized?: any[]; updated?: string }
  | any;

async function safeJson<T=any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function pickArray(p: any): any[] {
  if (!p) return [];
  if (Array.isArray(p.rows)) return p.rows;
  if (Array.isArray(p.itemsNormalized)) return p.itemsNormalized;
  if (Array.isArray(p.items)) return p.items;
  return [];
}

function apiUrl(tab: string): string {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  // Brug GAS direkte hvis sat, ellers vores lokale API-proxy
  return base
    ? `${base}?tab=${encodeURIComponent(tab)}`
    : `/api/sheets?sheet=${encodeURIComponent(tab)}`;
}

// Public API
export async function getForsideData(): Promise<{ map: SheetMap; updated?: string }> {
  const map: SheetMap = {};

  // Forside / hero / kort
  const forside = await safeJson<SheetApiResponse>(apiUrl("FORSIDE"));
  map.FORSIDE = pickArray(forside);

  // Nyheder
  const nyheder = await safeJson<SheetApiResponse>(apiUrl("NYHEDER"));
  map.NYHEDER = pickArray(nyheder);

  // Ticker
  const ticker = await safeJson<SheetApiResponse>(apiUrl("TICKER"));
  map.TICKER = pickArray(ticker)
    .map((r: any) => ({
      message: r?.message ?? "",
      title: r?.title ?? "",
      pin: r?.pin ?? "",
      date: r?.date ?? "",
      order: Number(r?.order ?? 0),
      start_on: r?.start_on ?? "",
      end_on: r?.end_on ?? "",
      channel: r?.channel ?? "",
    }))
    .filter((r: any) => String(r.message || "").trim() !== "");

  // KLUBINFO – key/value-konfiguration (navn, tagline, kontakt, SoMe)
  const klubinfo = await safeJson<SheetApiResponse>(apiUrl("KLUBINFO"));
  map.KLUBINFO = pickArray(klubinfo);

  const updated =
    (forside as any)?.updated ||
    (nyheder as any)?.updated ||
    (ticker as any)?.updated ||
    (klubinfo as any)?.updated;

  return { map, updated };
}

export default getForsideData;

