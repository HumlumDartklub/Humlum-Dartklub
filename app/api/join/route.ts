// app/api/join/route.ts
// Robust JOIN-endpoint der sender til Google Apps Script og returnerer stabil JSON

import { NextResponse } from "next/server";

export const revalidate = 0;              // ingen caching
export const dynamic = "force-dynamic";   // tvangsdynamik (Next 13+/16)

function getWebhook(): string {
  return (
    process.env.JOIN_WEBHOOK ||
    process.env.SHEET_API_URL ||
    process.env.NEXT_PUBLIC_SHEET_API ||
    ""
  ).trim();
}

function tryParseJSON(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function POST(req: Request) {
  const webhook = getWebhook();
  if (!webhook) {
    return NextResponse.json(
      { ok: false, error: "JOIN_WEBHOOK (eller fallback) mangler i .env.local" },
      { status: 500 }
    );
  }

  // Læs payload fra frontend (må gerne være tom)
  let incoming: any = {};
  try { incoming = await req.json(); } catch { incoming = {}; }

  // Payload til Apps Script (matcher doPost → { tab, data })
  const body = JSON.stringify({ tab: "JOIN", data: incoming });

  // Timeout-sikring
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000); // 15 sek.

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const text = await res.text().catch(() => "");
    const data = tryParseJSON(text);

    // Hvis Apps Script ikke er public, kan det returnere HTML-login
    if (text && text.trim().startsWith("<")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Apps Script returnerede HTML. Tjek Web App-deploy: Execute as 'Me' + Access 'Anyone with the link'.",
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        text ||
        `Upstream-fejl (HTTP ${res.status})`;
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }

    // Normalisér svar til { ok: true, result: ... }
    if (data && typeof data === "object") {
      const ok = Object.prototype.hasOwnProperty.call(data, "ok")
        ? Boolean((data as any).ok)
        : true;
      return NextResponse.json({ ok, result: data }, { status: 200 });
    }

    // OK status men ikke-JSON svar → pak ind
    return NextResponse.json({ ok: true, result: text || null }, { status: 200 });
  } catch (err: any) {
    clearTimeout(timer);
    const msg = String(err?.message || err || "Ukendt fejl");
    const status = /aborted/i.test(msg) ? 504 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

export async function GET() {
  // Lille sundhedstjek
  const hasEnv = !!getWebhook();
  return NextResponse.json({
    ok: true,
    info: "JOIN endpoint. Brug POST.",
    webhook: hasEnv ? "ok" : "missing",
  });
}
