/* [SHEET:FETCH:IMPORTS] START */
/* [SHEET:FETCH:IMPORTS] END */
// lib/fetchSheet.ts
/* [SHEET:FETCH:TYPES] START */
export type AnyRow = Record<string, any>;
/* [SHEET:FETCH:TYPES] END */

export async function fetchSheet(tab: string): Promise<AnyRow[]> {
  const name = String(tab || "").trim();
  if (!name) return [];

  const base = process.env.NEXT_PUBLIC_SHEET_API;

  // Hvis base findes, går vi direkte på GAS.
  // Ellers bruger vi vores lokale proxy /api/sheet
  const url = base
    ? `${base}?tab=${encodeURIComponent(name)}`
    : `/api/sheet?tab=${encodeURIComponent(name)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    if (Array.isArray(json?.rows)) return json.rows;
    if (Array.isArray(json?.itemsNormalized)) return json.itemsNormalized;
    if (Array.isArray(json?.items)) return json.items;

    return [];
  } catch {
    return [];
  }
}
