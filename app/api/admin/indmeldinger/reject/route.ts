import { NextRequest, NextResponse } from "next/server";

const SHEET_API = process.env.NEXT_PUBLIC_SHEET_API;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "hdk-admin-dev";

/* [HELP:ADMIN:INDMELDINGER:API:REJECT] START */
/**
 * GET – lille ping til at teste, at API'et svarer
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "HDK reject API is alive",
    sheetApi: SHEET_API ? "set" : "missing",
    adminToken: ADMIN_TOKEN ? "set" : "missing",
  });
}

export async function POST(req: NextRequest) {
  if (!SHEET_API) {
    return NextResponse.json(
      { ok: false, error: "NEXT_PUBLIC_SHEET_API is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const row = body?.row;

    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Missing row parameter" },
        { status: 400 }
      );
    }

    const url = new URL(SHEET_API);
    url.searchParams.set("action", "reject");
    url.searchParams.set("tab", "INDMELDINGER");
    url.searchParams.set("key", ADMIN_TOKEN);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ row: String(row) }),
      cache: "no-store",
      next: { revalidate: 0 },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            (data && (data as any).error) ||
            `Sheet API returned ${res.status} in reject`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error in /api/admin/indmeldinger/reject", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error in reject-API",
      },
      { status: 500 }
    );
  }
}
/* [HELP:ADMIN:INDMELDINGER:API:REJECT] END */
