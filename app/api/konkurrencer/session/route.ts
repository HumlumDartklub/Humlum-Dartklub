import { NextResponse } from "next/server";
import { getKioskFromRequest } from "@/lib/kioskAuth";

/* [HELP:KONKURRENCER:API:SESSION] START */

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

function clamp(s: any, max = 3000) {
  return String(s ?? "").trim().slice(0, max);
}

export async function GET(req: Request) {
  try {
    const sess = getKioskFromRequest(req);
    if (!sess) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN" }, { status: 500 });
    }

    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "ARCADE_EVENTS");
    url.searchParams.set("key", ADMIN_TOKEN);
    url.searchParams.set("limit", "500");

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const json: any = await res.json().catch(() => ({}));
    const rows: ArcadeEventRow[] = Array.isArray(json?.items) ? json.items : [];

    const hit = rows.find(
      (r) =>
        toYes(r?.visible) &&
        String(r?.event_code || "").trim().toUpperCase() === String(sess.event_code || "").trim().toUpperCase()
    );

    if (!hit) {
      // session er valid, men event er ikke aktiv længere
      return NextResponse.json({ ok: false, error: "Event ikke aktiv" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      session: { event_code: String(sess.event_code) },
      event: {
        title: clamp(hit?.title, 120),
        subtitle: clamp(hit?.subtitle, 200),
        period_text: clamp(hit?.period_text, 300),
        rules_text: clamp(hit?.rules_text, 3000),
        price_text: clamp(hit?.price_text, 800),
        prizes_text: clamp(hit?.prizes_text, 1200),
        leaderboard_limit: Number(hit?.leaderboard_limit || 5) || 5,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

/* [HELP:KONKURRENCER:API:SESSION] END */
