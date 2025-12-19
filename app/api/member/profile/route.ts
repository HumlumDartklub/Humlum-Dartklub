import { NextResponse } from "next/server";
import { getMemberFromRequest } from "@/lib/memberAuth";

type AnyObj = Record<string, any>;

function getGasUrl(): string {
  const u = (process.env.SHEET_API_URL || "").trim() || (process.env.NEXT_PUBLIC_SHEET_API || "").trim();
  if (!u) throw new Error("Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API");
  return u;
}

function getAdminKey(): string {
  const k = (process.env.SHEET_ADMIN_KEY || "").trim() || (process.env.ADMIN_LOGIN_TOKEN || "").trim();
  if (!k) throw new Error("Missing SHEET_ADMIN_KEY / ADMIN_LOGIN_TOKEN (bruges som admin key mod Apps Script)");
  return k;
}

function ymdTodayCopenhagen(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const m: AnyObj = {};
  for (const p of parts) m[p.type] = p.value;
  return `${m.year}-${m.month}-${m.day}`;
}

function normalizeYmd(v: any): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  let mm = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (mm) return `${mm[3]}-${mm[2]}-${mm[1]}`;
  mm = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mm) return `${mm[3]}-${mm[2]}-${mm[1]}`;
  return "";
}

export async function GET(req: Request) {
  try {
    const session = getMemberFromRequest(req);
    if (!session) return NextResponse.json({ ok: false }, { status: 401 });

    const gas = getGasUrl();
    const key = getAdminKey();

    const url = new URL(gas);
    url.searchParams.set("tab", "MEDLEMMER");
    url.searchParams.set("key", key);
    url.searchParams.set("limit", "2000");

    const upstream = await fetch(url.toString(), { cache: "no-store" });
    const data: any = await upstream.json().catch(() => null);
    if (!upstream.ok || !data || data.ok !== true) {
      return NextResponse.json(
        { ok: false, error: data?.error || "Kunne ikke hente MEDLEMMER." },
        { status: 502 }
      );
    }

    const items: AnyObj[] = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.rows)
        ? data.rows
        : [];

    const me = items.find((it) => String(it?.member_id || "").trim() === session.member_id);
    if (!me) {
      return NextResponse.json({ ok: false, error: "Medlem blev ikke fundet." }, { status: 404 });
    }

    const today = ymdTodayCopenhagen();
    const endYmd = normalizeYmd(me?.end_date);
    const expired = !!(endYmd && endYmd < today);

    return NextResponse.json({
      ok: true,
      profile: {
        member_id: String(me.member_id || "").trim(),
        status: String(me.status || "").trim(),
        expired,
        package_title: String(me.package_title || "").trim(),
        package_key: String(me.package_key || "").trim(),
        level: String(me.level || "").trim(),
        start_date: String(me.start_date || "").trim(),
        end_date: String(me.end_date || "").trim(),
        primary_team_id: String(me.primary_team_id || "").trim(),
        primary_team_role: String(me.primary_team_role || "").trim(),
        ddu_id: String(me.ddu_id || me.dduId || me.ddu || "").trim(),
        mentor: (() => {
          const s = String(me.is_mentor || "").trim().toLowerCase();
          return s === "true" || s === "yes" || s === "ja" || s === "1";
        })(),
        mentor_topics: String(me.mentor_topics || "").trim(),
        mentor_days: String(me.mentor_days || "").trim(),
        bio_short: String(me.bio_short || "").trim(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Fejl i member profile." },
      { status: 500 }
    );
  }
}
