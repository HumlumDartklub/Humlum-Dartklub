import { NextResponse } from "next/server";
import { getKioskFromRequest } from "@/lib/kioskAuth";

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

function clamp(s: any, max = 80) {
  return String(s || "").trim().slice(0, max);
}

function mkId() {
  return `PUR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/* [HELP:ARCADE:API:PURCHASE] START */
export async function POST(req: Request) {
  try {
    // Kun kiosk/ansvarlig må registrere køb
    const kiosk = getKioskFromRequest(req);
    if (!kiosk) {
      return bad("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));

    const event_code = clamp(body?.event_code || body?.meta?.event_code, 40);
    if (!event_code || !/^[A-Za-z0-9_\-]{3,40}$/.test(event_code)) {
      return bad("Missing/invalid event_code");
    }

    if (String(kiosk.event_code || "").trim().toUpperCase() !== event_code.trim().toUpperCase()) {
      return bad("Event mismatch", 403);
    }

    const nickname = clamp(body?.nickname, 24) || "Anonym";
    const full_name = clamp(body?.full_name, 60);
    const player_code = clamp(body?.player_code, 20);
    const attempts = Number(body?.purchased_attempts || body?.attempts || 0);
    if (!Number.isFinite(attempts) || attempts < 1 || attempts > 999) {
      return bad("Invalid purchased_attempts");
    }

    const created_at = clamp(body?.created_at || new Date().toISOString(), 40);
    const device_hash = clamp(body?.device_hash || body?.device_id, 64);
    const purchase_id = clamp(body?.purchase_id, 48) || mkId();

    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return bad("Missing SHEET_API_URL or ADMIN_TOKEN", 500);
    }

    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "ARCADE_PURCHASES");
    url.searchParams.set("action", "arcadePurchase");
    url.searchParams.set("key", ADMIN_TOKEN);

    const payload = {
      purchase_id,
      created_at,
      event_code,
      nickname,
      full_name,
      player_code,
      purchased_attempts: attempts,
      device_hash,
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

    return NextResponse.json({ ok: true, purchase_id });
  } catch (e: any) {
    return bad(e?.message || "Server error", 500);
  }
}
/* [HELP:ARCADE:API:PURCHASE] END */
