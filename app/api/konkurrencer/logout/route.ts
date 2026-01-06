import { NextResponse } from "next/server";
import { KIOSK_COOKIE } from "@/lib/kioskAuth";

/* [HELP:KONKURRENCER:API:LOGOUT] START */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // clear cookie
  res.cookies.set(KIOSK_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/* [HELP:KONKURRENCER:API:LOGOUT] END */
