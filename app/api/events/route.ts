import { NextResponse } from "next/server";
export const revalidate = 0;

const toRows = (d:any) => Array.isArray(d) ? d : (d?.rows ?? d?.data ?? []);

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) return NextResponse.json({ error: "Missing NEXT_PUBLIC_SHEET_API" }, { status: 500 });

  const teamId = new URL(req.url).searchParams.get("teamId") ?? "";

  const res = await fetch(`${base}?tab=EVENTS`, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Upstream "+res.status }, { status: 502 });

  let rows:any[] = toRows(await res.json())
    .filter((r:any)=>String(r.visible||"").toUpperCase()==="YES");

  if (teamId) rows = rows.filter((r:any)=>String(r.team_id||"")===teamId);

  const items = rows.map((r:any)=>({
    event_id: r.event_id,
    title: r.title,
    type: r.type,
    team_id: r.team_id,
    date: r.date,
    start_time: r.start_time,
    end_time: r.end_time,
    location: r.location,
    max_participants: r.max_participants,
  }));

  return NextResponse.json({ items });
}
