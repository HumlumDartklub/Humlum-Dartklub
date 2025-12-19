import { NextResponse } from "next/server";
import { MEMBER_COOKIE, memberCookieOptions } from "@/lib/memberAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Sæt cookie tom + udløb med det samme
  res.cookies.set(MEMBER_COOKIE, "", memberCookieOptions(0));
  return res;
}
