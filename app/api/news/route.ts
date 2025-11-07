// app/api/news/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) return NextResponse.json({ error: "Mangler NEXT_PUBLIC_SHEET_API" }, { status: 500 });

  const url = `${base}?tab=NYHEDER`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data?.items) ? data.items : []);
    const items = rows
      .map((r: any) => ({
        id: r?.id ?? undefined,
        title: r?.title ?? r?.overskrift ?? "",
        body: r?.body ?? r?.tekst ?? "",
        body_md: r?.body_md ?? "",
        status: r?.status ?? "",
        visible: r?.visible ?? "",
        order: Number(r?.order ?? 0),
        channel: r?.channel ?? "",
        link: r?.link ?? "",
        date: r?.date ?? ""
      }))
      .filter((r: any) => (r.visible || "").toString().toUpperCase() !== "NO")
      .sort((a: any, b: any) => a.order - b.order);

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Serverfejl" }, { status: 502 });
  }
}
