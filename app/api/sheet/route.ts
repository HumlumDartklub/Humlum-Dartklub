/* [HELP:API:IMPORTS] START */
import { NextResponse } from "next/server";
import { getMemberFromRequest, isAdminRequest } from "@/lib/memberAuth";
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
  if (!u) throw new Error("Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API");
  return u;
}

function getAdminKey(): string | undefined {
  // ADMIN_TOKEN = “nøgle” til GAS. Hvis ikke sat, bruger vi ADMIN_LOGIN_TOKEN.
  const k =
    process.env.ADMIN_TOKEN?.trim() ||
    process.env.ADMIN_LOGIN_TOKEN?.trim();
  return k || undefined;
}

const PUBLIC_TABS = new Set<string>([
  "KLUBINFO",
  "TICKER",
  "NYHEDER",
  "EVENTS",
  "HERO",
  "MEDIA",
  "OM_KLUBBEN",
  "FORSIDE",
  "MEDLEMSPAKKER",
  "SPONSORPAKKER",
  "SPONSOR_TILKOEB",
  "SPONSOR_STOET",
  "PROEVETRAENING",
  "SPONSORER",
  "VENNER",
  "SPONSORVAEG_TEKST",
  "BANESPONSOR_BANER",
]);
/* [HELP:API:UTIL:env] END */

function normalizeTab(t: string): string {
  return String(t || "").trim().toUpperCase();
}

/* [HELP:API:GET] START */
export async function GET(req: Request) {
  try {
    const gas = getGasUrl();
    const { searchParams } = new URL(req.url);

    const tabRaw = (searchParams.get("tab") || "").trim();
    if (!tabRaw) {
      return NextResponse.json(
        { ok: false, error: "tab is required" },
        { status: 400 }
      );
    }

    const tabKey = normalizeTab(tabRaw);
    const isPublic = PUBLIC_TABS.has(tabKey);
    const isAdmin = isAdminRequest(req);
    const member = getMemberFromRequest(req);
    const isMember = !!member;

    // Fjern ALTID client-supplied key (så ingen kan snyde)
    const params = new URLSearchParams(searchParams);
    params.delete("key");

    // Kun disse må få server-injected key:
    // - Admin: alle tabs
    // - Member: kun MEDLEMSZONE
    if (!isPublic) {
      const key = getAdminKey();
      if (!key) {
        return NextResponse.json(
          { ok: false, error: "Missing ADMIN_TOKEN/ADMIN_LOGIN_TOKEN (GAS key) on server" },
          { status: 500 }
        );
      }

      if (isAdmin) {
        params.set("key", key);
      } else if (isMember && tabKey === "MEDLEMSZONE") {
        params.set("key", key);
      } else {
        return NextResponse.json(
          { ok: false, error: "Unauthorized", tab: tabKey },
          { status: 401 }
        );
      }
    }

    // Sørg for original tab (case-insensitive i GAS, men vi sender raw)
    params.set("tab", tabRaw);

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
    // POST er kun for admin-handlinger (updates/paid/reject osv.)
    if (!isAdminRequest(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const gas = getGasUrl();
    const body: any = await req.json().catch(() => ({}));

    const tab = String(body.tab ?? "").trim();
    if (!tab) {
      return NextResponse.json(
        { ok: false, error: "payload.tab is required" },
        { status: 400 }
      );
    }

    const key = getAdminKey();
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Missing ADMIN_TOKEN/ADMIN_LOGIN_TOKEN (GAS key) on server" },
        { status: 500 }
      );
    }

    // Læs værdier fra body (og læg dem i query fordi Code.gs kigger i e.parameter)
    const action = String(body.action ?? "").trim() || undefined;
    const row    = String(body.row ?? "").trim() || undefined;
    const method = String(body.method ?? "").trim() || undefined;
    const note   = String(body.note ?? "").trim() || undefined;

    const url = new URL(gas);
    url.searchParams.set("key", key);
    url.searchParams.set("tab", tab);
    if (action) url.searchParams.set("action", action);
    if (row)    url.searchParams.set("row", row);
    if (method) url.searchParams.set("method", method);
    if (note)   url.searchParams.set("note", note);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
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
