import { NextResponse } from "next/server";

const SHEET_API_BASE =
  process.env.NEXT_PUBLIC_SHEET_API || process.env.SHEET_API_URL || "";

// Tving dynamisk fetch, ingen caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SponsorRow = {
  name?: string;
  logo_url?: string;
  website?: string;
  visible?: string;
  order?: number | string;
  [key: string]: any;
};

export async function GET() {
  try {
    if (!SHEET_API_BASE) {
      throw new Error("Missing NEXT_PUBLIC_SHEET_API / SHEET_API_URL");
    }

    const url = new URL(SHEET_API_BASE);
    url.searchParams.set("tab", "SPONSORER");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Sheet API HTTP ${res.status}`);

    const data: any = await res.json();
    const rows: SponsorRow[] = Array.isArray(data?.items) ? data.items : [];

    const items = rows
      .filter((r) => String(r?.name || "").trim() !== "")
      .filter((r) => {
        const v = String(r?.visible || "").trim().toUpperCase();
        return !v || v === "YES";
      })
      .sort((a, b) => Number(a?.order ?? 9999) - Number(b?.order ?? 9999))
      .map((r) => ({
        name: String(r?.name || "").trim(),
        logo_url: String(r?.logo_url || "").trim(),
        website: String(r?.website || "").trim(),
      }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("[sponsors] error", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
