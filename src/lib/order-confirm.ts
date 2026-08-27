/**
 * Cookie court (1 h) prouvant que le navigateur a créé la commande —
 * évite l’IDOR sur /commande/confirmation?id=
 */

import {
  createHmac,
  timingSafeEqual,
} from "crypto";

const COOKIE = "coin229_order_confirm";
const MAX_AGE_SEC = 60 * 60; // 1 heure

function getSecret(): string | null {
  const s =
    process.env.PHONE_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();
  return s && s.length >= 8 ? s : null;
}

export function orderConfirmCookieName() {
  return COOKIE;
}

export function orderConfirmCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function createOrderConfirmToken(orderId: string): string | null {
  const secret = getSecret();
  if (!secret || !orderId) return null;
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(
    JSON.stringify({ v: 1, orderId, exp }),
    "utf8"
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readOrderConfirmToken(
  token: string | undefined | null
): string | null {
  if (!token || !token.includes(".")) return null;
  const secret = getSecret();
  if (!secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { orderId?: string; exp?: number };
    if (!json.orderId || !json.exp || json.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return json.orderId;
  } catch {
    return null;
  }
}
