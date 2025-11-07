// app/api/ticker/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) return NextResponse.json({ error: "Mangler NEXT_PUBLIC_SHEET_API" }, { status: 500 });

  const url = `${base}?tab=TICKER`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data?.items) ? data.items : []);
    const items = rows
      .map((r: any) => ({
        message: r?.message ?? r?.tekst ?? "",
        title: r?.title ?? "",
        pin: r?.pin ?? "",
        date: r?.date ?? "",
        order: Number(r?.order ?? 0),
        start_on: r?.start_on ?? "",
        end_on: r?.end_on ?? "",
        channel: r?.channel ?? ""
      }))
      .filter((r: any) => (String(r.message || "").trim() !== "") && (String((rows.find(x=>x?.message===r.message)?.visible ?? "")).toUpperCase() === "YES"))
      .sort((a: any, b: any) => a.order - b.order);

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Serverfejl" }, { status: 502 });
  }
}
