import { NextResponse } from "next/server";
import { getMemberFromRequest } from "@/lib/memberAuth";

type AnyObj = Record<string, any>;

function getGasUrl(): string {
  const u = (process.env.SHEET_API_URL || "").trim() || (process.env.NEXT_PUBLIC_SHEET_API || "").trim();
  if (!u) throw new Error("Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API");
  return u;
}

function getAdminKey(): string {
  // Vi bruger server-side token til at læse MEDLEMMER – denne key må aldrig sendes til browseren.
  const k = (process.env.SHEET_ADMIN_KEY || "").trim() || (process.env.ADMIN_LOGIN_TOKEN || "").trim();
  if (!k) throw new Error("Missing ADMIN_LOGIN_TOKEN (bruges som admin key mod Apps Script)");
  return k;
}

function ymdTodayCopenhagen(): string {
  // YYYY-MM-DD i Europe/Copenhagen uden eksterne libs
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

  // dd-mm-yyyy / dd/mm/yyyy
  let m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "";
}

function isActiveMember(item: AnyObj): boolean {
  const status = String(item?.status || "").trim().toLowerCase();
  if (status !== "active") return false;

  const today = ymdTodayCopenhagen();
  const endYmd = normalizeYmd(item?.end_date);
  if (endYmd && endYmd < today) return false;

  return true;
}

function safeName(first: any, last: any) {
  const f = String(first || "").trim();
  const l = String(last || "").trim();
  return { first_name: f, last_name: l };
}

export async function GET(req: Request) {
  try {
    const member = getMemberFromRequest(req);
    if (!member) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

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

    const members = items
      .filter(isActiveMember)
      .map((it) => {
        const { first_name, last_name } = safeName(it.first_name, it.last_name);
        const level = String(it.level || "").trim();
        const member_id = String(it.member_id || "").trim();

        const created_at = String(it.created_at || it.createdAt || it.created || "").trim();
        const start_date = String(it.start_date || it.startDate || "").trim();
        const end_date = String(it.end_date || it.endDate || "").trim();

        // Mentor felter (kan komme senere – vi håndterer dem hvis de findes)
        const is_mentor = String(it.is_mentor || "").trim().toLowerCase();
        const mentor = is_mentor === "true" || is_mentor === "yes" || is_mentor === "ja" || is_mentor === "1";
        const mentor_topics = String(it.mentor_topics || "").trim();
        const mentor_days = String(it.mentor_days || "").trim();
        const bio_short = String(it.bio_short || "").trim();

        // DDU ID (valgfri – kun relevant for turnering)
        const ddu_id = String(it.ddu_id || it.dduId || it.ddu || "").trim();

        return {
          member_id,
          first_name,
          last_name,
          level,
          created_at,
          start_date,
          end_date,
          primary_team_id: String(it.primary_team_id || "").trim(),
          primary_team_role: String(it.primary_team_role || "").trim(),
          mentor,
          mentor_topics,
          mentor_days,
          bio_short,
          ddu_id,
        };
      })
      .filter((m) => m.member_id && (m.first_name || m.last_name));

    // Backwards/forwards compatible: nogle pages forventer `items`, andre `members`
    return NextResponse.json({ ok: true, items: members, members });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Fejl i member list." },
      { status: 500 }
    );
  }
}
