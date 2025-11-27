import { NextResponse } from "next/server";

const ADMIN_COOKIE = "hdk_admin_auth";
const ADMIN_TOKEN = process.env.ADMIN_LOGIN_TOKEN || "hdk-admin";

export async function POST(req: Request) {
  let code = "";

  try {
    const body = await req.json();
    if (typeof body?.code === "string") {
      code = body.code.trim();
    }
  } catch {
    // ignorer parse-fejl
  }

  if (!code || code !== ADMIN_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Forkert kode." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  // Sæt httpOnly-cookie som middleware kan tjekke
  res.cookies.set(ADMIN_COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dage
  });

  return res;
}
