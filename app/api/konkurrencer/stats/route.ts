import { NextResponse } from "next/server";
import { getKioskFromRequest } from "@/lib/kioskAuth";
import { isAdminRequest } from "@/lib/memberAuth";

/* [HELP:KONKURRENCER:API:STATS] START */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

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

function clamp(s: any, max = 80) {
  return String(s ?? "").trim().slice(0, max);
}

function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeUpper(v: any): string {
  return String(v ?? "").trim().toUpperCase();
}

async function fetchTab(SHEET_API_URL: string, ADMIN_TOKEN: string, tab: string): Promise<AnyRow[]> {
  const url = new URL(SHEET_API_URL);
  url.searchParams.set("tab", tab);
  url.searchParams.set("key", ADMIN_TOKEN);
  url.searchParams.set("limit", "50000");

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  const json: any = await res.json().catch(() => ({}));
  const rows: AnyRow[] = Array.isArray(json?.items) ? json.items : [];
  return rows;
}

export async function GET(req: Request) {
  try {
    const isAdmin = isAdminRequest(req);
    const kiosk = getKioskFromRequest(req);

    if (!isAdmin && !kiosk) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const q = clamp(searchParams.get("event_code"), 500);

    const requested = new Set<string>();
    for (const part of String(q || "")
      .split(",")
      .map((s) => safeUpper(s))
      .filter(Boolean)) {
      requested.add(part);
    }

    // scorekeeper må kun få sit eget event
    if (kiosk && !isAdmin) {
      requested.clear();
      requested.add(safeUpper(kiosk.event_code));
    }

    const [purchases, scores] = await Promise.all([
      fetchTab(SHEET_API_URL, ADMIN_TOKEN, "ARCADE_PURCHASES"),
      fetchTab(SHEET_API_URL, ADMIN_TOKEN, "ARCADE_SCORES"),
    ]);

    const purchasedAttempts = new Map<string, number>();
    const playerCodes = new Map<string, Set<string>>();
    const scoreCount = new Map<string, number>();
    const scorePlayers = new Map<string, Set<string>>();

    for (const r of purchases) {
      const ev = safeUpper(r?.event_code);
      if (!ev) continue;
      if (requested.size && !requested.has(ev)) continue;

      purchasedAttempts.set(ev, (purchasedAttempts.get(ev) || 0) + Math.max(0, toNum(r?.purchased_attempts, 0)));

      const pid = clamp(r?.player_code || r?.nickname, 120);
      if (pid) {
        if (!playerCodes.has(ev)) playerCodes.set(ev, new Set());
        playerCodes.get(ev)!.add(pid);
      }
    }

    for (const r of scores) {
      const game = String(r?.game || "").trim();
      if (game && game !== "nine") continue;

      let ev = "";
      try {
        const meta = JSON.parse(String(r?.meta_json || "{}"));
        ev = safeUpper(meta?.event_code);
      } catch {
        ev = safeUpper((r as any)?.event_code);
      }

      if (!ev) continue;
      if (requested.size && !requested.has(ev)) continue;

      scoreCount.set(ev, (scoreCount.get(ev) || 0) + 1);

      const nick = clamp(r?.nickname, 120);
      if (nick) {
        if (!scorePlayers.has(ev)) scorePlayers.set(ev, new Set());
        scorePlayers.get(ev)!.add(nick);
      }
    }

    const keys = new Set<string>();
    for (const k of purchasedAttempts.keys()) keys.add(k);
    for (const k of scoreCount.keys()) keys.add(k);
    for (const k of playerCodes.keys()) keys.add(k);
    for (const k of scorePlayers.keys()) keys.add(k);

    const outKeys = requested.size ? Array.from(requested.values()) : Array.from(keys.values());

    const items = outKeys
      .filter(Boolean)
      .map((ev) => {
        const playersA = playerCodes.get(ev)?.size || 0;
        const playersB = scorePlayers.get(ev)?.size || 0;
        return {
          event_code: ev,
          participants: Math.max(playersA, playersB),
          purchased_attempts: purchasedAttempts.get(ev) || 0,
          scores_count: scoreCount.get(ev) || 0,
        };
      });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

/* [HELP:KONKURRENCER:API:STATS] END */
