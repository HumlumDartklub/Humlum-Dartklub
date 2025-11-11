/* [HELP:API:IMPORTS] START */
import { NextResponse } from "next/server";
/* [HELP:API:IMPORTS] END */

/* [HELP:API:CONFIG:dynamic] START */
export const dynamic = "force-dynamic";
/* [HELP:API:CONFIG:dynamic] END */
/* [HELP:API:CONFIG:revalidate] START */
export const revalidate = 0;
/* [HELP:API:CONFIG:revalidate] END */

/* [HELP:API:UTIL:env] START */
function getGasUrl(): string {
  const u =
    process.env.SHEET_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_SHEET_API?.trim() ||
    "";
  if (!u) {
    throw new Error(
      "GAS Web App URL mangler. Sæt SHEET_API_URL eller NEXT_PUBLIC_SHEET_API i .env.local"
    );
  }
  return u;
}
function getAdminKey(): string | undefined {
  const k = process.env.ADMIN_TOKEN?.trim();
  return k || undefined;
}
/* [HELP:API:UTIL:env] END */

/* [HELP:API:GET] START */
export async function GET(req: Request) {
  try {
    const gas = getGasUrl();
    const { searchParams } = new URL(req.url);

    const tab = (searchParams.get("tab") || "").trim();
    if (!tab) {
      return NextResponse.json(
        { ok: false, error: "tab is required" },
        { status: 400 }
      );
    }

    // Sørg for at key sendes med (hvis ikke allerede angivet)
    const params = new URLSearchParams(searchParams);
    if (!params.has("key")) {
      const key = getAdminKey();
      if (key) params.set("key", key);
    }

    const target = `${gas}?${params.toString()}`;
    const res = await fetch(target, { method: "GET", cache: "no-store" });

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json")
      ? await res.json()
      : await res.text();

    return NextResponse.json(
      typeof body === "string" ? { ok: false, error: body } : body,
      { status: res.ok ? 200 : res.status || 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "GET /api/sheet failed" },
      { status: 500 }
    );
  }
}
/* [HELP:API:GET] END */

/* [HELP:API:POST] START */
export async function POST(req: Request) {
  try {
    const gas = getGasUrl();
    const body: any = await req.json().catch(() => ({}));

    const tab = String(body.tab ?? "").trim();
    if (!tab) {
      return NextResponse.json(
        { ok: false, error: "payload.tab is required" },
        { status: 400 }
      );
    }

    // Læs værdier fra body (og læg dem i query fordi Code.gs kigger i e.parameter)
    const key    = String(body.key ?? getAdminKey() ?? "").trim() || undefined;
    const action = String(body.action ?? "").trim() || undefined;
    const row    = String(body.row ?? "").trim() || undefined;
    const method = String(body.method ?? "").trim() || undefined;
    const note   = String(body.note ?? "").trim() || undefined;

    const url = new URL(gas);
    if (key)    url.searchParams.set("key", key);
    url.searchParams.set("tab", tab);
    if (action) url.searchParams.set("action", action);
    if (row)    url.searchParams.set("row", row);
    if (method) url.searchParams.set("method", method);
    if (note)   url.searchParams.set("note", note);

    // Body kan indeholde ekstra data – GAS må ignorere dem, men vi sender dem med
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const ct = res.headers.get("content-type") || "";
    const out = ct.includes("application/json") ? await res.json() : await res.text();

    return NextResponse.json(
      typeof out === "string" ? { ok: false, error: out } : out,
      { status: res.ok ? 200 : res.status || 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "POST /api/sheet failed" },
      { status: 500 }
    );
  }
}
/* [HELP:API:POST] END */
