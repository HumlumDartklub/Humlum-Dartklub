import { NextResponse } from "next/server";

/**
 * Backwards-compatible endpoint used by ArcadeHub.
 * Den videresender bare til /api/arcade/submit med samme payload.
 */
// [HELP:API_ARCADE_FINISH] START

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const base = new URL(req.url);
    const target = new URL("/api/arcade/submit", base);

    const res = await fetch(target.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return NextResponse.json(json || { ok: false, error: "Bad response" }, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}


// [HELP:API_ARCADE_FINISH] END
