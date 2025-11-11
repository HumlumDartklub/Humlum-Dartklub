// app/api/join/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const SHEET_API_URL = process.env.SHEET_API_URL!;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;

    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Missing SHEET_API_URL or ADMIN_TOKEN" },
        { status: 500 }
      );
    }

    // Send til vores Web App som JOIN-aktion på fanen INDMELDINGER
    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "INDMELDINGER");
    url.searchParams.set("action", "join");
    url.searchParams.set("key", ADMIN_TOKEN);

    const upstream = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!upstream.ok || !data || data.ok !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: "Upstream not JSON",
          debug: {
            status: upstream.status,
            url: url.toString(),
            contentType: upstream.headers.get("content-type"),
            snippet: text.slice(0, 600),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
