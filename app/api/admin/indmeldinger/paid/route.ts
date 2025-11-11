/* [HELP:API:IMPORTS] START */
import { NextResponse } from "next/server";
import { sheetPost } from "@/lib/sheet";
/* [HELP:API:IMPORTS] END */

/* [HELP:API:GET] START */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const row = (searchParams.get("row") || "").trim();
    const method = (searchParams.get("method") || "").trim();
    const note = (searchParams.get("note") || "").trim();
    const adminTokenFromQuery = (searchParams.get("key") || "").trim();

    if (!row) {
      return NextResponse.json({ ok: false, error: "row is required" }, { status: 400 });
    }

    // Brug query-nøglen hvis givet, ellers ENV (fallback til dev)
    const KEY = adminTokenFromQuery || process.env.ADMIN_TOKEN || "hdk-admin-dev";

    // Payload (ekstra data i body — selve parametre lægges på query i /api/sheet)
    const payload = {
      tab: "INDMELDINGER",
      action: "markPaid",           // ★ matcher Code.gs
      row,
      method: method || "manual",
      note,
      key: KEY,
      data: {
        status: "paid",
        payment_method: method || "manual",
        payment_date: new Date().toISOString().slice(0, 10),
        admin_note: note,
      },
    };

    const resp = await sheetPost(payload);
    return NextResponse.json(resp, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
  }
}
/* [HELP:API:GET] END */
