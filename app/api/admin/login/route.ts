import { NextResponse } from "next/server";

const ADMIN_COOKIE = "hdk_admin_auth";

function getAdminAuthToken(): string {
  return (
    (process.env.ADMIN_LOGIN_TOKEN || "").trim() ||
    (process.env.ADMIN_TOKEN || "").trim() ||
    "hdk-admin"
  );
}

function isProd(): boolean {
  return (process.env.NEXT_PUBLIC_SITE_ENV || "").toLowerCase() === "prod";
}

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

  const adminToken = getAdminAuthToken();

  if (!code || code !== adminToken) {
    return NextResponse.json(
      { ok: false, error: "Forkert kode." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set(ADMIN_COOKIE, adminToken, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}