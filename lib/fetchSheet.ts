// lib/fetchSheet.ts
export type AnyRow = Record<string, any>;

export async function fetchSheet(tab: string): Promise<AnyRow[]> {
  const name = String(tab || "").trim();
  if (!name) return [];

  const base = process.env.NEXT_PUBLIC_SHEET_API;
  const url = base
    ? `${base}?tab=${encodeURIComponent(name)}`
    : `/api/sheets?sheet=${encodeURIComponent(name)}`;

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
