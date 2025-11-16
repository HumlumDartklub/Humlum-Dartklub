import { NextRequest, NextResponse } from "next/server";

const SHEET_API = process.env.NEXT_PUBLIC_SHEET_API;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "hdk-admin-dev";

/**
 * GET – kun til test i browseren
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "HDK markPaid API is alive",
    sheetApi: SHEET_API ? "set" : "missing",
    adminToken: ADMIN_TOKEN ? "set" : "missing",
  });
}

/**
 * POST – markér indmelding som betalt + opret/vedligehold MEDLEMMER
 */
export async function POST(req: NextRequest) {
  try {
    if (!SHEET_API || !ADMIN_TOKEN) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing SHEET_API or ADMIN_TOKEN. Tjek .env.local (NEXT_PUBLIC_SHEET_API + ADMIN_TOKEN).",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const row = body?.row;
    const method = body?.method || "MobilePay";

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "row is required" },
        { status: 400 }
      );
    }

    // VIGTIGT: Apps Script forventer admin-nøglen i query-parametrene
    const url =
      SHEET_API +
      `?tab=INDMELDINGER&action=markPaid&key=${encodeURIComponent(
        ADMIN_TOKEN
      )}`;

    // Body bruges til row + betalingsmetode
    const payload = {
      row: String(row),
      method,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok || !data || data.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          error:
            (data && data.error) ||
            `Apps Script markPaid failed (${res.status})`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error in /api/admin/indmeldinger/paid", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error in paid-API" },
      { status: 500 }
    );
  }
}
