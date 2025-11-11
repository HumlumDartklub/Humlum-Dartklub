import { NextResponse } from "next/server";

const API = process.env.SHEET_API_URL;
const KEY = process.env.ADMIN_TOKEN;

// Fælles helper til at kalde GAS via GET (undgår POST/redirect bøvl)
async function callMarkPaid(row: number, method?: string, date?: string, note?: string) {
  if (!API || !KEY) {
    return NextResponse.json(
      { ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN env" },
      { status: 500 }
    );
  }
  const url = new URL(API);
  url.searchParams.set("tab", "INDMELDINGER");
  url.searchParams.set("action", "markPaid");
  url.searchParams.set("row", String(row));
  if (method) url.searchParams.set("method", method);
  if (date) url.searchParams.set("date", date);
  if (note) url.searchParams.set("note", note);
  url.searchParams.set("key", KEY);

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const ok = res.ok && data && data.ok !== false;
  return NextResponse.json(data, { status: ok ? 200 : 500 });
}

// GET — så du kan teste i browseren
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const row = Number(searchParams.get("row") || "0");
  const method = searchParams.get("method") || undefined;
  const date = searchParams.get("date") || undefined;
  const note = searchParams.get("note") || undefined;
  if (!row) return NextResponse.json({ ok: false, error: "Missing row" }, { status: 400 });
  return callMarkPaid(row, method, date, note);
}

// POST — til UI-kald fra admin
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const row = Number(body.row || 0);
  const method = body.method as string | undefined;
  const date = body.date as string | undefined;
  const note = body.note as string | undefined;
  if (!row) return NextResponse.json({ ok: false, error: "Missing row" }, { status: 400 });
  return callMarkPaid(row, method, date, note);
}
