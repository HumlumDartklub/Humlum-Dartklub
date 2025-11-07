// app/api/sponsor/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.firma || !body?.kontakt || !body?.email) {
      return NextResponse.json({ ok: false, error: "Felt mangler (firma/kontakt/email)" }, { status: 400 });
    }
    const hook = process.env.SPONSOR_WEBHOOK;
    if (hook) {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfejl" }, { status: 500 });
  }
}
