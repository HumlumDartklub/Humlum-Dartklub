import { NextResponse } from "next/server";

const SHEET_API_BASE =
  process.env.NEXT_PUBLIC_SHEET_API || process.env.SHEET_API_URL || "";

// Tving dynamisk fetch, ingen build-time caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

type TickerRow = {
  message?: string;
  visible?: string;
  order?: number | string;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
};

export async function GET() {
  try {
    if (!SHEET_API_BASE) {
      throw new Error("Missing NEXT_PUBLIC_SHEET_API / SHEET_API_URL");
    }

    const url = new URL(SHEET_API_BASE);
    url.searchParams.set("tab", "TICKER");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Sheet API HTTP ${res.status}`);
    }

    const data: any = await res.json();
    const rows: TickerRow[] = Array.isArray(data?.items) ? data.items : [];

    const items = rows
      .filter((row) => {
        const msg = row?.message;
        if (typeof msg !== "string" || msg.trim() === "") return false;

        // visible skal være tom eller "YES"
        const visible = String(row?.visible || "").trim().toUpperCase();
        if (visible && visible !== "YES") return false;

        // Evt. datofilter (kun aktiv inden for start/end, hvis sat)
        const now = new Date();
        const hasStart = row.start_date && String(row.start_date).trim() !== "";
        const hasEnd = row.end_date && String(row.end_date).trim() !== "";

        if (hasStart) {
          const d = new Date(row.start_date as string);
          if (!isNaN(d.getTime()) && d > now) return false;
        }

        if (hasEnd) {
          const d = new Date(row.end_date as string);
          if (!isNaN(d.getTime()) && d < now) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const ao = Number(a?.order ?? 0);
        const bo = Number(b?.order ?? 0);
        return ao - bo;
      })
      .map((row) => ({
        message: String(row.message ?? "").trim(),
      }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("[ticker] error", err);
    // Fallback: tom liste i stedet for fejl
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
