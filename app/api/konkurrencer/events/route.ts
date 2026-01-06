import { NextResponse } from "next/server";
import { getKioskFromRequest } from "@/lib/kioskAuth";
import { isAdminRequest } from "@/lib/memberAuth";

/* [HELP:KONKURRENCER:API:EVENTS] START */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ArcadeEventRow = Record<string, any>;

type PublicStatus = "LIVE" | "UPCOMING" | "PAST";

type PodiumItem = { nickname: string; value: number };

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

function toNum(v: any, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(s: any, max = 3000) {
  return String(s ?? "").trim().slice(0, max);
}

function safeParseJson(s: any) {
  try {
    return JSON.parse(String(s || "{}"));
  } catch {
    return {};
  }
}

function safeUpper(v: any): string {
  return String(v ?? "").trim().toUpperCase();
}

function normalizeStatus(v: any): PublicStatus {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return "LIVE";
  if (["LIVE", "ACTIVE", "AKTIV"].includes(s)) return "LIVE";
  if (
    [
      "UPCOMING",
      "COMING",
      "COMMING", // 🙃 ja, den klassiske stavefejl
      "COMING_SOON",
      "SOON",
      "KOMMER",
      "KOMMER_SNART",
      "KOMMENDE",
    ].includes(s)
  )
    return "UPCOMING";
  if (["PAST", "ENDED", "DONE", "ARCHIVE", "AFSLUTTET"].includes(s)) return "PAST";
  return "LIVE";
}

function pickFirst(obj: any, keys: string[]): any {
  for (const k of keys) {
    const v = obj?.[k];
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s) return v;
  }
  return "";
}

export async function GET(req: Request) {
  try {
    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN" }, { status: 500 });
    }

    const isAdmin = isAdminRequest(req);
    const kiosk = getKioskFromRequest(req);

    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "ARCADE_EVENTS");
    url.searchParams.set("key", ADMIN_TOKEN);
    url.searchParams.set("limit", "500");

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const json: any = await res.json().catch(() => ({}));
    const rows: ArcadeEventRow[] = Array.isArray(json?.items) ? json.items : [];

    const visibleRows = rows.filter((r) => toYes(r?.visible));

    // Find arkiv-events (PAST) og deres event_code internt (må ikke sendes offentligt)
    const archiveCodes = new Set<string>();
    for (const r of visibleRows) {
      const status = normalizeStatus(pickFirst(r, ["status", "event_status", "public_status"]));
      if (status !== "PAST") continue;
      const code = safeUpper(clamp(r?.event_code, 40));
      if (code) archiveCodes.add(code);
    }

    // Top 3 pr arkiv-event (ud fra ARCADE_SCORES) — offentligt viser vi kun podium, aldrig intern statistik.
    const podiumByCode = new Map<string, PodiumItem[]>();
    if (archiveCodes.size > 0) {
      const scoresUrl = new URL(SHEET_API_URL);
      scoresUrl.searchParams.set("tab", "ARCADE_SCORES");
      scoresUrl.searchParams.set("key", ADMIN_TOKEN);
      scoresUrl.searchParams.set("limit", "50000");

      const sres = await fetch(scoresUrl.toString(), { method: "GET", cache: "no-store" });
      const sjson: any = await sres.json().catch(() => ({}));
      const srows: any[] = Array.isArray(sjson?.items) ? sjson.items : [];

      // best pr nickname pr event_code (laveste value vinder)
      const best: Map<string, Map<string, { value: number; created_at: string }>> = new Map();

      for (const r of srows) {
        const game = String(r?.game || "").trim();
        if (game && game !== "nine") continue;

        const value = Number(r?.value);
        if (!Number.isFinite(value) || value < 0) continue;

        const meta = safeParseJson(r?.meta_json);
        const ev = safeUpper(meta?.event_code);
        if (!ev || !archiveCodes.has(ev)) continue;

        const nickname = clamp(r?.nickname, 24) || "Anonym";
        const created_at = String(r?.created_at || "");

        if (!best.has(ev)) best.set(ev, new Map());
        const byName = best.get(ev)!;
        const cur = byName.get(nickname);

        if (!cur) {
          byName.set(nickname, { value, created_at });
          continue;
        }

        // Bedste = laveste value. Ved samme value: ældste timestamp vinder (stabil sortering).
        if (value < cur.value) {
          byName.set(nickname, { value, created_at });
        } else if (value === cur.value) {
          const ta = Date.parse(created_at) || 0;
          const tb = Date.parse(cur.created_at) || 0;
          if (ta && tb && ta < tb) {
            byName.set(nickname, { value, created_at });
          }
        }
      }

      for (const ev of archiveCodes.values()) {
        const byName = best.get(ev);
        if (!byName) {
          podiumByCode.set(ev, []);
          continue;
        }

        const podium = Array.from(byName.entries())
          .map(([nickname, v]) => ({ nickname, value: v.value }))
          .sort((a, b) => a.value - b.value)
          .slice(0, 3);

        podiumByCode.set(ev, podium);
      }
    }

    const items = visibleRows
      .map((r) => {
        const status = normalizeStatus(pickFirst(r, ["status", "event_status", "public_status"]));
        const badgeText = clamp(pickFirst(r, ["badge_text", "badge", "public_badge"]), 40);
        const badgeVariant = clamp(pickFirst(r, ["badge_variant", "badge_type", "badge_kind"]), 20);
        const badgeVisible = String(pickFirst(r, ["badge_visible", "show_badge"]) || "YES").trim().toUpperCase();

        const draw_status = clamp(pickFirst(r, ["draw_status"]), 30);
        const draw_winner_nickname = clamp(pickFirst(r, ["draw_winner_nickname"]), 60);
        const draw_winner_note = clamp(pickFirst(r, ["draw_winner_note"]), 800);
        const draw_drawn_at = clamp(pickFirst(r, ["draw_drawn_at"]), 80);

        const base: any = {
          // BEVIDST: event_code må aldrig eksponeres offentligt.
          title: clamp(r?.title, 120),
          subtitle: clamp(r?.subtitle, 200),
          period_text: clamp(r?.period_text, 300),
          rules_text: clamp(r?.rules_text, 3000),
          price_text: clamp(r?.price_text, 800),
          prizes_text: clamp(r?.prizes_text, 1200),
          leaderboard_limit: toNum(r?.leaderboard_limit, 5),
          order: toNum(r?.order, 9999),

          // nye public felter (styres af sheet hvis de findes)
          status,
          badge_text: badgeVisible === "NO" ? "" : badgeText,
          badge_variant: badgeVisible === "NO" ? "" : badgeVariant,

          // Offentligt arkiv: podium + lodtrækning (ingen interne tal)
          podium: status === "PAST" ? podiumByCode.get(safeUpper(clamp(r?.event_code, 40))) || [] : [],
          draw_status,
          draw_winner_nickname,
          draw_winner_note,
          draw_drawn_at,
        };

        // Intern visning (admin: alle, scorekeeper: kun sit eget event)
        if (isAdmin) {
          base.event_code = safeUpper(clamp(r?.event_code, 40));
        } else if (kiosk) {
          const evc = safeUpper(clamp(r?.event_code, 40));
          if (evc && evc === safeUpper(kiosk.event_code)) {
            base.event_code = evc;
          }
        }

        return base;
      })
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

/* [HELP:KONKURRENCER:API:EVENTS] END */
