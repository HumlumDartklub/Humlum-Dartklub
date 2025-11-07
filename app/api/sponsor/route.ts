// app/api/sponsor/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const required = ["firma","kontakt","email"];
    for (const k of required) {
      if (!body?.[k] || String(body[k]).trim() === "") {
        return NextResponse.json({ ok:false, error:`Felt mangler: ${k}` }, { status:400 });
      }
    }

    const endpoint = process.env.NEXT_PUBLIC_SHEET_API || process.env.SHEET_API_URL || process.env.NEXT_PUBLIC_SHEETS_ENDPOINT;
    if (!endpoint) return NextResponse.json({ ok:false, error:"Mangler NEXT_PUBLIC_SHEET_API" }, { status:500 });

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ tab:"SPONSORER", data: {
        id: "", ts: new Date().toISOString(),
        firma: body.firma, kontakt: body.kontakt, email: body.email, telefon: body.telefon || "", kommentar: body.kommentar || "", status: "NY"
      }}),
      cache: "no-store",
    });

    const json = await res.json().catch(()=>({}));
    if (!res.ok || json?.ok === false) {
      return NextResponse.json({ ok:false, error: json?.error || `Upstream ${res.status}` }, { status:502 });
    }
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || "Serverfejl" }, { status:500 });
  }
}
