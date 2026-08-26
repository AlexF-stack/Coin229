/**
 * Auth admin — cookie de session opaque (HMAC), jamais le mot de passe.
 * Compatible Edge (Web Crypto) et Node.
 */

const COOKIE = "coin229_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 jours

function getAdminPassword(): string | null {
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  if (!pwd || pwd.length < 8) return null;
  if (
    process.env.NODE_ENV === "production" &&
    (pwd === "coin229admin" || pwd === "change-me-strong-password")
  ) {
    return null;
  }
  return pwd;
}

function getSessionSecret(): string | null {
  const custom = process.env.ADMIN_SESSION_SECRET?.trim();
  if (custom && custom.length >= 16) return custom;
  return getAdminPassword();
}

function b64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof atob !== "undefined") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return b64urlEncode(sig);
}

async function hmacVerify(
  secret: string,
  message: string,
  signature: string
): Promise<boolean> {
  const expected = await hmacSign(secret, message);
  if (expected.length !== signature.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return ok === 0;
}

export function adminCookieName() {
  return COOKIE;
}

export function adminCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPassword() && getSessionSecret());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  if (password.length !== expected.length) {
    // timing-ish: still compare lengths separately
  }
  let ok = password.length === expected.length ? 0 : 1;
  const a = password;
  const b = expected;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    ok |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return ok === 0;
}

export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = b64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({ v: 1, iat: now, exp: now + MAX_AGE_SEC })
    )
  );
  const sig = await hmacSign(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const secret = getSessionSecret();
  if (!secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const valid = await hmacVerify(secret, payload, sig);
  if (!valid) return false;
  try {
    const json = JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as {
      exp?: number;
    };
    if (!json.exp || json.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Redirection safe : uniquement chemins /admin internes */
export function safeAdminNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin")) return "/admin";
  if (next.startsWith("//") || next.includes("://")) return "/admin";
  return next;
}
