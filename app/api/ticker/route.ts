<<<<<<< HEAD
// @ts-nocheck
=======
>>>>>>> dacec37 (feat(api): hero, ticker, teams, events from Admin Sheet)
import { NextResponse } from "next/server";
export const revalidate = 0;

<<<<<<< HEAD
type TickerItem = { message: string };

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_SHEET_API;
    if (!base) throw new Error("Missing NEXT_PUBLIC_SHEET_API");

    const url = `${base}?tab=TICKER`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    const data = await res.json();

    const items: TickerItem[] = Array.isArray(data?.items)
      ? data.items
          .filter((it: any) => typeof it?.message === "string" && it.message.trim() !== "")
          .map((it: any) => ({ message: String(it.message).trim() }))
      : [];

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ items: [], error: String(err?.message || err) });
=======
// Hjælp: normaliser upstream svar til en array af rækker
const toRows = (d:any) => Array.isArray(d) ? d : (d?.rows ?? d?.data ?? []);

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SHEET_API;
  if (!base) return NextResponse.json({ error: "Missing NEXT_PUBLIC_SHEET_API" }, { status: 500 });

  // Hent både frie ticker-linjer og HERO (for slides med ticker_visible=YES)
  const [freeRes, heroRes] = await Promise.all([
    fetch(`${base}?tab=TICKER`, { cache: "no-store" }),
    fetch(`${base}?tab=HERO`,   { cache: "no-store" }),
  ]);

  if (!freeRes.ok || !heroRes.ok) {
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
>>>>>>> dacec37 (feat(api): hero, ticker, teams, events from Admin Sheet)
  }

  const free = toRows(await freeRes.json())
    .filter((r:any)=>String(r.visible||"").toUpperCase()==="YES")
    .map((r:any)=>({ message: String(r.message||"").trim(), order: Number(r.order ?? 9999) }));

  const hero = toRows(await heroRes.json())
    .filter((r:any)=>String(r.visible||"").toUpperCase()==="YES" &&
                    String(r.ticker_visible||"").toUpperCase()==="YES")
    .map((r:any)=>({ message: String(r.ticker_msg||"").trim(), order: Number(r.order ?? 9999) }));

  const items = [...free, ...hero]
    .filter(x => x.message)
    .sort((a,b)=>(a.order??9999)-(b.order??9999));

  return NextResponse.json({ items });
}
