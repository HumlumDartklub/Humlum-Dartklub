import crypto from "crypto";

/**
 * Kiosk/ansvarlig-login til konkurrencer.
 * - Offentlig side må aldrig få event_code.
 * - Kun ansvarlig (kiosk) får cookie-session.
 */

/* [HELP:KIOSK:AUTH] START */

export const KIOSK_COOKIE = "hdk_kiosk_auth";

export type KioskSession = {
  event_code: string;
  exp: number; // unix seconds
};

function isProdEnv(): boolean {
  const v = (process.env.NEXT_PUBLIC_SITE_ENV || "").toLowerCase();
  return v === "prod";
}

function getSecret(): string {
  const s = (process.env.KIOSK_COOKIE_SECRET || "").trim();
  if (s) return s;

  // fallback 1: brug samme som member cookie
  const member = (process.env.MEMBER_COOKIE_SECRET || "").trim();
  if (member) return member;

  // fallback 2: admin token (ikke ideelt, men bedre end at crashe)
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

export function signKioskToken(
  payload: Omit<KioskSession, "exp">,
  maxAgeSeconds = 60 * 60 * 12 // 12 timer
): { token: string; exp: number; maxAgeSeconds: number } {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Missing KIOSK_COOKIE_SECRET (eller fallback secrets).");
  }

  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const body: KioskSession = { ...payload, exp };

  const json = Buffer.from(JSON.stringify(body), "utf8");
  const part = base64urlEncode(json);
  const sig = hmacSha256(part, secret);

  return { token: `${part}.${sig}`, exp, maxAgeSeconds };
}

export function verifyKioskToken(token?: string | null): KioskSession | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;

  const [part, sig] = token.split(".");
  if (!part || !sig) return null;

  const expected = hmacSha256(part, secret);
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
  if (!payload.event_code || !payload.exp) return null;

  const now = Math.floor(Date.now() / 1000);
  if (Number(payload.exp) < now) return null;

  return payload as KioskSession;
}

function readCookieFromHeader(cookieHeader: string, name: string): string | null {
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

export function getKioskFromRequest(req: Request): KioskSession | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const raw = readCookieFromHeader(cookieHeader, KIOSK_COOKIE);
  return verifyKioskToken(raw);
}

export function kioskCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProdEnv(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/* [HELP:KIOSK:AUTH] END */
