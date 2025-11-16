import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { row, team_id, role } = (body || {}) as {
      row?: number | string;
      team_id?: string;
      role?: string;
    };

    const SHEET_API_URL =
      process.env.SHEET_API_URL || process.env.NEXT_PUBLIC_SHEET_API;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN" },
        { status: 500 },
      );
    }

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "row required" },
        { status: 400 },
      );
    }

    const payload = {
      tab: "MEDLEMMER",
      action: "setPrimaryTeam",
      row: String(row),
      team_id: team_id || "",
      primary_team_id: team_id || "",
      role: role || "",
      primary_team_role: role || "",
      key: ADMIN_TOKEN,
    };

    const res = await fetch(SHEET_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.warn("Apps Script response is not valid JSON", {
        snippet: text?.slice(0, 300),
      });
    }

    if (!res.ok || !data || data.ok === false) {
      const msg =
        (data && (data.error || data.message)) ||
        `Upstream HTTP ${res.status}`;
      return NextResponse.json(
        { ok: false, error: msg, upstream: data || null },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
