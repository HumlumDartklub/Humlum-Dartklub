import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { row, billing_method, billing_frequency, annual_amount_dkk, installment_amount_dkk, email_send } = body || {};

    const SHEET_API_URL = process.env.SHEET_API_URL || process.env.NEXT_PUBLIC_SHEET_API;
    const ADMIN_TOKEN   = process.env.ADMIN_TOKEN;

    if (!SHEET_API_URL || !ADMIN_TOKEN) {
      return NextResponse.json({ ok:false, error:"Missing SHEET_API_URL or ADMIN_TOKEN" }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ ok:false, error:"row required" }, { status: 400 });
    }

    const url = `${SHEET_API_URL}?tab=INDMELDINGER&action=savePayment&key=${encodeURIComponent(ADMIN_TOKEN)}&row=${encodeURIComponent(row)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        billing_method,
        billing_frequency,
        annual_amount_dkk,
        installment_amount_dkk,
        email_send
      })
    });

    const text = await res.text();
    // Google kan svare med text/html ved fejl → prøv at parse
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { ok:false, error:"Upstream not JSON", debug: { status: res.status, contentType: res.headers.get("content-type"), snippet: text?.slice(0,300) } }; }

    if (!res.ok || !data?.ok) {
      return NextResponse.json(data || { ok:false, error:`Upstream HTTP ${res.status}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: err?.message || "Server error" }, { status: 500 });
  }
}
