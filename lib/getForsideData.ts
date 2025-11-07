// lib/getForsideData.ts

export type ForsideRow = {
  id?: string | number;
  title?: string;
  body?: string;
  image?: string;
  order?: number;
};

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    // Forsøg JSON – enkelte backends sender text med JSON-indhold
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return await res.json();
    } else {
      const txt = await res.text();
      try { return JSON.parse(txt); } catch { return null; }
    }
  } catch {
    return null;
  }
}

function normalizeRows(data: any): ForsideRow[] {
  if (!data) return [];
  const rows =
    Array.isArray(data) ? data
    : Array.isArray(data.rows) ? data.rows
    : Array.isArray(data.data) ? data.data
    : Array.isArray(data.items) ? data.items
    : Array.isArray(data.FORSIDE) ? data.FORSIDE
    : [];

  return rows.map((r: any) => ({
    id: r.id ?? r.ID ?? undefined,
    title: String(r.title ?? r.TITLE ?? r.headline ?? "").trim(),
    body: String(r.body ?? r.body_md ?? r.text ?? "").trim(),
    image: String(r.image ?? r.img ?? "").trim(),
    order: Number(r.order ?? r.sort ?? 9999),
  }));
}

/**
 * Forsøger flere kilder i rækkefølge:
 * 1) /api/sheets?sheet=FORSIDE   (proxy til Apps Script)
 * 2) /api/sheets?tab=FORSIDE
 * 3) /api/sheet?tab=FORSIDE      (gammel lokal route)
 */
export async function getForsideData(): Promise<ForsideRow[]> {
  const tries = [
    `/api/sheets?sheet=FORSIDE&cb=${Date.now()}`,
    `/api/sheets?tab=FORSIDE&cb=${Date.now()}`,
    `/api/sheet?tab=FORSIDE&cb=${Date.now()}`,
  ];

  for (const url of tries) {
    const data = await fetchJson(url);
    const rows = normalizeRows(data);
    if (rows.length) {
      // sortér efter order hvis angivet
      return rows.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    }
  }

  // Ingen data – returner tomt i stedet for at kaste, så UI kan loade
  return [];
}
