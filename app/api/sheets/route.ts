// app/api/sheets/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) {
    return NextResponse.json({ error: "Mangler NEXT_PUBLIC_SHEET_API" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  // vi accepterer både ?sheet= og ?tab=
  const tab = (searchParams.get("sheet") || searchParams.get("tab") || "").trim();
  if (!tab) {
    return NextResponse.json({ error: "Mangler ?sheet= eller ?tab=" }, { status: 400 });
  }

  const url = `${base}?tab=${encodeURIComponent(tab)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    // Normaliser et “itemsNormalized”-array for bekvemmelighed
    const raw = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data?.items) ? data.items : []);
    const itemsNormalized = raw.map((r: any) => ({
      id: r?.id ?? undefined,
      title: r?.title ?? r?.overskrift ?? "",
      body: r?.body ?? r?.tekst ?? "",
      body_md: r?.body_md ?? "",
      image: r?.image ?? "",
      status: r?.status ?? "",
      visible: r?.visible ?? r?.vis ?? "",
      order: Number(r?.order ?? 0),
      start_on: r?.start_on ?? "",
      end_on: r?.end_on ?? "",
      channel: r?.channel ?? "",
      link: r?.link ?? "",
      pin: r?.pin ?? "",
      date: r?.date ?? ""
    })).sort((a: any, b: any) => a.order - b.order);

    return NextResponse.json({ ok: true, tab, ...data, itemsNormalized });
  } catch (e: any) {
    return NextResponse.json({ error: `Upstream fejl: ${e?.message || String(e)}` }, { status: 502 });
  }
}
