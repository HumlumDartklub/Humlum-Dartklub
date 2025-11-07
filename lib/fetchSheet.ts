// lib/fetchSheet.ts
// Robust fetch af Sheet-faner (NYHEDER, MEDLEMSPAKKER, TICKER m.fl.)
// 1) Prøver lokal /api/sheet?tab=<TAB>
// 2) Prøver Apps Script endpoint i NEXT_PUBLIC_SHEET_API
// 3) Normaliserer {rows|data|items|<TAB>} -> array
// 4) Returnerer [] hvis intet findes

type AnyRow = Record<string, any>;

function extractRows(payload: any, tab?: string): AnyRow[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as AnyRow[];
  if (Array.isArray(payload?.rows)) return payload.rows as AnyRow[];
  if (Array.isArray(payload?.data)) return payload.data as AnyRow[];
  if (Array.isArray(payload?.items)) return payload.items as AnyRow[];
  if (tab && Array.isArray((payload as any)[tab])) return (payload as any)[tab] as AnyRow[];
  return [];
}

function buildLocalUrl(tab: string) {
  const origin =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.SITE_URL ||
        "http://localhost:3000"
      : "";
  const base = typeof window === "undefined" ? origin : "";
  return `${base}/api/sheet?tab=${encodeURIComponent(tab)}`;
}

async function tryLocal(tab: string) {
  try {
    const r = await fetch(buildLocalUrl(tab), { cache: "no-store" });
    if (!r.ok) return [];
    const json = await r.json();
    return extractRows(json, tab);
  } catch {
    return [];
  }
}

async function tryAppsScript(tab: string) {
  const base =
    process.env.NEXT_PUBLIC_SHEET_API ||
    process.env.SHEET_API_URL ||
    "";
  if (!base) return [];
  try {
    const sep = base.includes("?") ? "&" : "?";
    const url = `${base}${sep}tab=${encodeURIComponent(tab)}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const json = await r.json();
    return extractRows(json, tab);
  } catch {
    return [];
  }
}

/**
 * fetchSheet(tab)
 * Forsøger flere kilder; returnerer altid et array.
 */
export async function fetchSheet(tab: string): Promise<AnyRow[]> {
  const name = String(tab || "").trim();
  if (!name) return [];
  // 1) Lokal API
  const fromLocal = await tryLocal(name);
  if (fromLocal.length) return fromLocal;
  // 2) Apps Script
  const fromApps = await tryAppsScript(name);
  if (fromApps.length) return fromApps;
  // 3) Tomt fallback
  return [];
}
