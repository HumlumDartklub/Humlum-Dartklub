import { NextResponse } from "next/server";
import { signMemberToken, MEMBER_COOKIE, memberCookieOptions } from "@/lib/memberAuth";

function getGasUrl(): string {
  const u =
    (process.env.SHEET_API_URL || "").trim() ||
    (process.env.NEXT_PUBLIC_SHEET_API || "").trim();
  if (!u) throw new Error("Missing SHEET_API_URL / NEXT_PUBLIC_SHEET_API");
  return u;
}

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();

    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: "Indtast både email og kode." },
        { status: 400 }
      );
    }

    const gas = getGasUrl();
    const upstream = await fetch(gas, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ action: "memberlogin", email, code }),
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
        { ok: false, error: data?.error || "Forkert email eller kode." },
        { status: 401 }
      );
    }

    const member = data.member || {};
    const member_id = String(member.member_id || "").trim();
    const first_name = String(member.first_name || "").trim();
    const last_name = String(member.last_name || "").trim();
    const safeEmail = String(member.email || email).trim().toLowerCase();

    if (!member_id) {
      return NextResponse.json(
        { ok: false, error: "Login-fejl: mangler member_id." },
        { status: 500 }
      );
    }

    const { token, maxAgeSeconds } = signMemberToken({
      member_id,
      email: safeEmail,
      first_name,
      last_name,
    });

    const res = NextResponse.json({
      ok: true,
      member: { member_id, email: safeEmail, first_name, last_name },
    });

    res.cookies.set(MEMBER_COOKIE, token, memberCookieOptions(maxAgeSeconds));
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Login fejlede." },
      { status: 500 }
    );
  }
}
