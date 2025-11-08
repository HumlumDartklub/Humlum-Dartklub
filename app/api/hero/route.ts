import { NextResponse } from "next/server";
export const revalidate = 0;

function toRows(d:any){ return Array.isArray(d) ? d : (d?.rows ?? d?.data ?? []); }

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) return NextResponse.json({ error: "Missing NEXT_PUBLIC_SHEET_API" }, { status: 500 });

  const res = await fetch(`${base}?tab=HERO`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Upstream "+res.status }, { status: 502 });

  const rows = toRows(await res.json());
  const items = rows
    .filter((r:any)=>String(r.visible||"").toUpperCase()==="YES")
    .map((r:any)=>({
      url: String(r.url||"").trim(),
      headline: r.headline ?? "",
      subline: r.subline ?? "",
      overlay: r.overlay ?? "dark",
      link_url: r.link_url ?? "",
      order: Number(r.order ?? 9999),
      ticker: String(r.ticker_visible||"").toUpperCase()==="YES" ? (r.ticker_msg ?? "") : ""
    }))
    .filter((x:any)=>x.url)
    .sort((a:any,b:any)=>(a.order??9999)-(b.order??9999));

  return NextResponse.json({ items });
}
