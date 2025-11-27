import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "hdk_admin_auth";
const ADMIN_TOKEN = process.env.ADMIN_LOGIN_TOKEN || "hdk-admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login-siden må altid besøges
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Alt andet under /admin kræver cookie
  if (pathname.startsWith("/admin")) {
    const cookie = req.cookies.get(ADMIN_COOKIE)?.value || "";

    if (cookie === ADMIN_TOKEN) {
      return NextResponse.next();
    }

    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
