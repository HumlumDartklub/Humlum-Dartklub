import { NextResponse } from "next/server";
import { kioskCookieOptions, signKioskToken, KIOSK_COOKIE } from "@/lib/kioskAuth";

/* [HELP:KONKURRENCER:API:LOGIN] START */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ArcadeEventRow = Record<string, any>;

function getCfg() {
  const SHEET_API_URL = (process.env.SHEET_API_URL || process.env.NEXT_PUBLIC_SHEET_API || "").trim();
  const ADMIN_TOKEN =
    (process.env.ADMIN_TOKEN ||
      process.env.SHEET_ADMIN_KEY ||
      process.env.GAS_ADMIN_KEY ||
      process.env.HDK_ADMIN_TOKEN ||
      process.env.ADMIN_LOGIN_TOKEN ||
      "").trim();
  return { SHEET_API_URL, ADMIN_TOKEN };
}

function toYes(v: any): boolean {
  return String(v ?? "").trim().toUpperCase() === "YES";
}

function clamp(s: any, max = 80) {
  return String(s ?? "").trim().slice(0, max);
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const event_code = clamp(body?.event_code, 40).toUpperCase();

    if (!event_code || !/^[A-Z0-9_\-]{3,40}$/.test(event_code)) {
      return bad("Missing/invalid event_code");
    }

    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return bad("Missing SHEET_API_URL or ADMIN_TOKEN", 500);
    }

    // find event in ARCADE_EVENTS
    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "ARCADE_EVENTS");
    url.searchParams.set("key", ADMIN_TOKEN);
    url.searchParams.set("limit", "500");

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const json: any = await res.json().catch(() => ({}));
    const rows: ArcadeEventRow[] = Array.isArray(json?.items) ? json.items : [];

    const hit = rows.find((r) => toYes(r?.visible) && String(r?.event_code || "").trim().toUpperCase() === event_code);
    if (!hit) {
      return bad("Eventcode findes ikke (eller event er ikke aktiv).", 401);
    }

    const { token, maxAgeSeconds } = signKioskToken({ event_code });
    const out = NextResponse.json(
      {
        ok: true,
        event: {
          title: clamp(hit?.title, 120),
          subtitle: clamp(hit?.subtitle, 200),
          period_text: clamp(hit?.period_text, 300),
        },
      },
      { status: 200 }
    );

    out.cookies.set(KIOSK_COOKIE, token, kioskCookieOptions(maxAgeSeconds));
    return out;
  } catch (e: any) {
    return bad(e?.message || "Server error", 500);
  }
}

/* [HELP:KONKURRENCER:API:LOGIN] END */
