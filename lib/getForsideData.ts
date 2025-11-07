// lib/getForsideData.ts

export type SheetMap = {
  FORSIDE?: any[];
  NYHEDER?: any[];
  [key: string]: any[] | undefined;
};

type ForsideResponse =
  | { ok?: boolean; rows?: any[]; items?: any[]; itemsNormalized?: any[]; updated?: string }
  | any;

/**
 * Henter FORSIDE-data fra dit Sheets-API.
 * Bruger i denne rækkefølge:
 *   1) NEXT_PUBLIC_FORSIDE_ENDPOINT  (direkte endpoint der returnerer {rows:[...]})
 *   2) NEXT_PUBLIC_SHEET_API?sheet=FORSIDE
 *   3) /api/sheets?sheet=FORSIDE  (lokal route i appen)
 */
export async function getForsideData(): Promise<{ map: SheetMap; updated?: string }> {
  const envA = process.env.NEXT_PUBLIC_FORSIDE_ENDPOINT?.trim();
  const envB = process.env.NEXT_PUBLIC_SHEET_API?.trim();

  const endpoint =
    envA ||
    (envB ? `${envB}${envB.includes("?") ? "&" : "?"}sheet=FORSIDE` : `/api/sheets?sheet=FORSIDE`);

  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    const data: ForsideResponse = await res.json();

    // Normaliser rækker
    let rows: any[] = [];
    if (Array.isArray(data?.rows)) rows = data.rows;
    else if (Array.isArray(data?.items)) rows = data.items;
    else if (Array.isArray(data?.itemsNormalized)) rows = data.itemsNormalized;

    const updated: string | undefined = data?.updated ? String(data.updated) : undefined;

    const map: SheetMap = { FORSIDE: rows };
    return { map, updated };
  } catch (_err) {
    // Returnér tom map ved fejl – så appen ikke crasher.
    return { map: {}, updated: undefined };
  }
}
