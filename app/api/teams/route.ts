import { NextResponse } from "next/server";
export const revalidate = 0;

const toRows = (d:any) => Array.isArray(d) ? d : (d?.rows ?? d?.data ?? []);

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) return NextResponse.json({ error: "Missing NEXT_PUBLIC_SHEET_API" }, { status: 500 });

  const res = await fetch(`${base}?tab=TEAMS`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Upstream "+res.status }, { status: 502 });

  const rows = toRows(await res.json());
  const chips = rows
    .filter((t:any) =>
      String(t.visible||"").toUpperCase()==="YES" &&
      String(t.chip_visible||"").toUpperCase()==="YES" &&
      String(t.card_group||"") !== ""
    )
    .map((t:any)=>({
      team_id: String(t.team_id||"").trim(),
      chip_label: String(t.chip_label||"").trim(),
      chip_order: Number(t.chip_order ?? 9999),
      card_group: String(t.card_group||"").trim(),
      card_blurb: String(t.card_blurb||"").trim(),
      card_link_url: String(t.card_link_url||"").trim()
    }))
    .sort((a:any,b:any)=>(a.chip_order??9999)-(b.chip_order??9999));

  return NextResponse.json({ chips });
}
