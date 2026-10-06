/**
 * Session téléphone signée (cookie httpOnly) — remplace localStorage pour l’IDOR.
 */

import { normalizeBjPhone } from "@/lib/bj-phone";
import { getSessionSecret, hasKind, signingInput } from "@/lib/session-secrets";

const COOKIE = "coin229_phone";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 jours

function getSecret(): string | null {
  return getSessionSecret("phone");
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

export function phoneCookieName() {
  return COOKIE;
}

export function phoneCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export { normalizeBjPhone };

export async function createPhoneSessionToken(
  phone: string
): Promise<string | null> {
  const secret = getSecret();
  const normalized = normalizeBjPhone(phone);
  if (!secret || !normalized) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = b64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        v: 2,
        typ: "phone",
        phone: normalized,
        iat: now,
        exp: now + MAX_AGE_SEC,
      })
    )
  );
  const sig = await hmacSign(secret, signingInput("phone", payload));
  return `${payload}.${sig}`;
}

export async function readPhoneFromToken(
  token: string | undefined | null
): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const secret = getSecret();
  if (!secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!(await hmacVerify(secret, signingInput("phone", payload), sig))) {
    return null;
  }
  try {
    const json = JSON.parse(
      new TextDecoder().decode(b64urlDecode(payload))
    ) as { phone?: string; exp?: number };
    if (!hasKind(json, "phone") || !json.phone || !json.exp || json.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return json.phone;
  } catch {
    return null;
  }
}

/** OTP démo uniquement hors production stricte */
export function allowDemoOtp(): boolean {
  if (process.env.ALLOW_DEMO_OTP === "true") return true;
  if (process.env.ALLOW_DEMO_OTP === "false") return false;
  return process.env.NODE_ENV !== "production";
}
