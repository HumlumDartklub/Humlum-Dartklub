// app/api/join/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = ["pakke", "navn", "email"];
    for (const k of required) {
      if (!body?.[k] || String(body[k]).trim() === "") {
        return NextResponse.json({ ok: false, error: `Felt mangler: ${k}` }, { status: 400 });
      }
    }

    const hook = process.env.JOIN_WEBHOOK; // fx din Apps Script Web App URL
    if (hook) {
      // forward til GAS som JSON
      try {
        const r = await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "signup",
            payload: body,
          }),
        });
        // Vi ignorerer r-body, blot status
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          console.warn("[JOIN] webhook not ok:", r.status, txt);
        }
      } catch (e) {
        console.warn("[JOIN] webhook error:", e);
      }
    } else {
      console.warn("[JOIN] No JOIN_WEBHOOK set. Skipping forward.");
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfejl" }, { status: 500 });
  }
}
