// @ts-nocheck
import { NextResponse } from "next/server";

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
  }
}
