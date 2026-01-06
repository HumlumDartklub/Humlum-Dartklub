import { NextResponse } from "next/server";
import { getKioskFromRequest } from "@/lib/kioskAuth";

type ArcadeGameKey = "nine";

function getCfg() {
  const SHEET_API_URL = process.env.SHEET_API_URL || process.env.NEXT_PUBLIC_SHEET_API;
  const ADMIN_TOKEN =
    process.env.ADMIN_TOKEN ||
    process.env.SHEET_ADMIN_KEY ||
    process.env.GAS_ADMIN_KEY ||
    process.env.HDK_ADMIN_TOKEN;
  return { SHEET_API_URL, ADMIN_TOKEN };
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function clampNickname(s: any) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

/* [HELP:ARCADE:API:SUBMIT] START */
export async function POST(req: Request) {
  try {
    // Kiosk/ansvarlig gate — ingen offentlig submit
    const kiosk = getKioskFromRequest(req);
    if (!kiosk) {
      return bad("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));
    const nickname = clampNickname(body?.nickname);
    const game = "nine" as ArcadeGameKey;
    const value = Number(body?.value);
    const created_at = String(body?.created_at || new Date().toISOString());
    const device_hash = String(body?.device_hash || "").slice(0, 64);

    const event_code = String(body?.event_code || body?.meta?.event_code || "").trim();

    const meta =
      body?.meta && typeof body.meta === "object" ? (body.meta as Record<string, any>) : {};

    // Minimal sanity gate (undgår helt random spam-formater)
    if (!event_code || !/^[A-Za-z0-9_\-]{3,40}$/.test(event_code)) {
      return bad("Missing/invalid event_code");
    }

    // Event i payload skal matche kiosk-session
    if (String(kiosk.event_code || "").trim().toUpperCase() !== event_code.trim().toUpperCase()) {
      return bad("Event mismatch", 403);
    }

    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return bad("Missing SHEET_API_URL or ADMIN_TOKEN", 500);
    }

    if (!nickname) return bad("Missing nickname");
    if (!Number.isFinite(value) || value < 0) return bad("Invalid value");

    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "ARCADE_SCORES");
    url.searchParams.set("action", "arcadeSubmit");
    url.searchParams.set("key", ADMIN_TOKEN);

    const payload = {
      nickname,
      game,
      value,
      created_at,
      device_hash,
      meta_json: JSON.stringify({ ...(meta || {}), event_code }),
      source: "hdk-arcade",
    };

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data || data.ok !== true) {
      const msg = data?.error || data?.message || `Upstream HTTP ${res.status}`;
      return bad(msg, 500);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return bad(err?.message || "Server error", 500);
  }
}
/* [HELP:ARCADE:API:SUBMIT] END */
