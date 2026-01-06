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

function clamp(s: any, max = 60) {
  return String(s || "").trim().slice(0, max);
}

function toYes(v: any): boolean {
  return String(v ?? "").trim().toUpperCase() === "YES";
}

function safeParseJson(s: any) {
  try {
    return JSON.parse(String(s || "{}"));
  } catch {
    return {};
  }
}

type Row = {
  created_at?: string;
  nickname?: string;
  game?: string;
  value?: any;
  meta_json?: string;
  device_hash?: string;
};

/* [HELP:ARCADE:API:LEADERBOARD] START */
export async function GET(req: Request) {
  try {
    // Kun kiosk/ansvarlig må se leaderboard for en event (event_code skal ikke være offentlig)
    const kiosk = getKioskFromRequest(req);
    if (!kiosk) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const game = (searchParams.get("game") || "nine") as ArcadeGameKey;
    const event_code = clamp(searchParams.get("event_code"), 40);
    if (event_code && String(kiosk.event_code || "").trim().toUpperCase() !== event_code.trim().toUpperCase()) {
      return NextResponse.json({ ok: false, error: "Event mismatch" }, { status: 403 });
    }
    const limit = Math.min(10, Math.max(1, Number(searchParams.get("limit") || 10)));

    const { SHEET_API_URL, ADMIN_TOKEN } = getCfg();
    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN" }, { status: 500 });
    }

    // Hent scores via GAS (admin key inject) — vi filtrerer i Next.
    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "ARCADE_SCORES");
    url.searchParams.set("key", ADMIN_TOKEN);
    url.searchParams.set("limit", "2000");

    const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    const json: any = await res.json().catch(() => ({}));
    const rows: Row[] = Array.isArray(json?.items) ? json.items : [];

    // Filter rows
    const filtered = rows
      .map((r) => {
        const meta = safeParseJson((r as any).meta_json);
        return {
          created_at: (r as any).created_at,
          nickname: clamp((r as any).nickname, 24) || "Anonym",
          game: (r as any).game,
          value: Number((r as any).value),
          meta,
        };
      })
      .filter((r) => Number.isFinite(r.value) && r.value >= 0)
      .filter((r) => !game || r.game === game)
      .filter((r) => !event_code || String(r.meta?.event_code || "") === event_code);

    // Toplist: bedste pr nickname (laveste value)
    const bestByName = new Map<string, typeof filtered[number]>();
    for (const r of filtered) {
      const key = r.nickname;
      const cur = bestByName.get(key);
      if (!cur || r.value < cur.value) bestByName.set(key, r);
    }
    const items = Array.from(bestByName.values()).sort((a, b) => a.value - b.value).slice(0, limit);

    // Seneste: sidste 6 (kun til visning)
    const recent = filtered
      .slice()
      .sort((a, b) => {
        const ta = Date.parse(a.created_at || "") || 0;
        const tb = Date.parse(b.created_at || "") || 0;
        return tb - ta;
      })
      .slice(0, 6);

    return NextResponse.json({ ok: true, game, metric: "min", items, recent });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
/* [HELP:ARCADE:API:LEADERBOARD] END */
