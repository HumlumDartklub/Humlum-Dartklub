import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const SHEET_API_URL =
      process.env.SHEET_API_URL ||
      process.env.NEXT_PUBLIC_SHEET_API ||
      "";

    if (!SHEET_API_URL) {
      return NextResponse.json(
        { ok: false, error: "Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API" },
        { status: 500 }
      );
    }

    // Vi sender sponsor-tilmelding til SPONSORER-fanen via Apps Script
    const url = new URL(SHEET_API_URL);
    url.searchParams.set("tab", "SPONSORER");
    url.searchParams.set("action", "sponsor");

    // Giv lidt kontekst i body (App Script ignorerer felter den ikke har headers til)
    const payload = {
      ...body,
      source: body?.source || "website",
      source_form_version: body?.source_form_version || "sponsor-tilmelding-v1",
    };

    const upstream = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
    });

    const text = await upstream.text();

    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!upstream.ok || !data || data.ok !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: data?.error || "Upstream not JSON",
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
