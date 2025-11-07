// app/api/join/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.pakke || !body?.navn || !body?.email) {
      return NextResponse.json({ ok: false, error: "Felt mangler (pakke/navn/email)" }, { status: 400 });
    }
    // Forward til webhook hvis sat
    const hook = process.env.JOIN_WEBHOOK;
    if (hook) {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Serverfejl" }, { status: 500 });
  }
}
