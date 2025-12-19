import crypto from "crypto";

export const MEMBER_COOKIE = "hdk_member_auth";
export const ADMIN_COOKIE = "hdk_admin_auth";

export type MemberSession = {
  member_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  exp: number; // unix seconds
};

function isProdEnv(): boolean {
  const v = (process.env.NEXT_PUBLIC_SITE_ENV || "").toLowerCase();
  return v === "prod";
}

export function isProd(): boolean {
  return isProdEnv();
}

function getSecret(): string {
  const s = (process.env.MEMBER_COOKIE_SECRET || "").trim();
  if (s) return s;

  // Fallback: Hvis du ikke har sat MEMBER_COOKIE_SECRET endnu, så brug ADMIN_LOGIN_TOKEN
  // (ikke ideelt, men bedre end at login crasher).
  const fallback = (process.env.ADMIN_LOGIN_TOKEN || "").trim();
  return fallback || "";
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecodeToBuffer(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function hmacSha256(data: string, secret: string): string {
  return base64urlEncode(crypto.createHmac("sha256", secret).update(data).digest());
}

export function signMemberToken(
  payload: Omit<MemberSession, "exp">,
  maxAgeSeconds = 60 * 60 * 24 * 30
): { token: string; exp: number; maxAgeSeconds: number } {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Missing MEMBER_COOKIE_SECRET (eller ADMIN_LOGIN_TOKEN fallback).");
  }

  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const body: MemberSession = { ...payload, exp };

  const json = Buffer.from(JSON.stringify(body), "utf8");
  const part = base64urlEncode(json);
  const sig = hmacSha256(part, secret);

  return { token: `${part}.${sig}`, exp, maxAgeSeconds };
}

export function verifyMemberToken(token?: string | null): MemberSession | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const [part, sig] = token.split(".");
  if (!part || !sig) return null;

  const expected = hmacSha256(part, secret);
  // Timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  let payload: any = null;
  try {
    payload = JSON.parse(base64urlDecodeToBuffer(part).toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  if (!payload.member_id || !payload.email || !payload.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  if (Number(payload.exp) < now) return null;

  return payload as MemberSession;
}

function readCookieFromHeader(cookieHeader: string, name: string): string | null {
  // Simple cookie parsing
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (!p) continue;
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq).trim();
    if (k !== name) continue;
    return decodeURIComponent(p.slice(eq + 1));
  }
  return null;
}

export function getMemberFromRequest(req: Request): MemberSession | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const raw = readCookieFromHeader(cookieHeader, MEMBER_COOKIE);
  return verifyMemberToken(raw);
}

export function isAdminRequest(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const raw = readCookieFromHeader(cookieHeader, ADMIN_COOKIE);
  const adminToken = (process.env.ADMIN_LOGIN_TOKEN || "hdk-admin").trim();
  return !!raw && raw === adminToken;
}

export function memberCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProdEnv(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
