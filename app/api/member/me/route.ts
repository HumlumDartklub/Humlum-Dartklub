import { NextResponse } from "next/server";
import { getMemberFromRequest } from "@/lib/memberAuth";

export async function GET(req: Request) {
  const member = getMemberFromRequest(req);
  if (!member) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { member_id, email, first_name, last_name, exp } = member;
  return NextResponse.json({ ok: true, member: { member_id, email, first_name, last_name, exp } });
}
