/**
 * Cookie prouvant que ce navigateur a créé ses commandes — évite l'IDOR sur
 * /commande/confirmation?id= et /commande/paiement?id=.
 * Garde les dernières commandes (pas seulement la dernière) pendant 7 jours :
 * suivi de livraison, paiement à finaliser, plusieurs commandes de suite.
 */

import {
  createHmac,
  timingSafeEqual,
} from "crypto";
import { getSessionSecret, hasKind, signingInput } from "@/lib/session-secrets";

const COOKIE = "coin229_order_confirm";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 jours
/** Commandes mémorisées au maximum (les plus récentes) */
export const MAX_REMEMBERED_ORDERS = 10;

function getSecret(): string | null {
  return getSessionSecret("order");
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

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret)
    .update(signingInput("order", payload))
    .digest("base64url");
}

/** Identifiants des commandes autorisées par le cookie (vide si invalide / expiré) */
export function readOrderConfirmIds(token: string | undefined | null): string[] {
  if (!token || !token.includes(".")) return [];
  const secret = getSecret();
  if (!secret) return [];
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return [];
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(secret, payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return [];
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      ids?: unknown;
      orderId?: unknown;
      exp?: number;
    };
    if (!hasKind(json, "order") || !json.exp || json.exp < Math.floor(Date.now() / 1000)) {
      return [];
    }
    // Ancien format (une seule commande) toujours accepté
    const ids = Array.isArray(json.ids) ? json.ids : [json.orderId];
    return ids.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

/** Nouveau jeton : la commande ajoutée en tête, sans doublon, 10 au plus */
export function addOrderToConfirmToken(
  currentToken: string | undefined | null,
  orderId: string
): string | null {
  const secret = getSecret();
  if (!secret || !orderId) return null;
  const ids = [orderId, ...readOrderConfirmIds(currentToken).filter((id) => id !== orderId)]
    .slice(0, MAX_REMEMBERED_ORDERS);
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(
    JSON.stringify({ v: 3, typ: "order", ids, exp }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${sign(secret, payload)}`;
}
