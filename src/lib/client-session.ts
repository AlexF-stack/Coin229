import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionSecret, hasKind, signingInput } from "@/lib/session-secrets";

/**
 * Session client « email + mot de passe » (cookie signé, 30 jours).
 * Contient l'id du client et sa version de session : changer le mot de passe
 * déconnecte toutes les sessions ouvertes.
 */
const COOKIE = "coin229_client";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function clientCookieName() {
  return COOKIE;
}

export function clientCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function sign(secret: string, payload: string) {
  return createHmac("sha256", secret).update(signingInput("client", payload)).digest("base64url");
}

export function createClientSessionToken(clientId: string, sessionVersion: number): string | null {
  const secret = getSessionSecret("client");
  if (!secret) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ typ: "client", cid: clientId, sv: sessionVersion, iat: now, exp: now + MAX_AGE_SEC })
  ).toString("base64url");
  return `${payload}.${sign(secret, payload)}`;
}

/** Id du client si le jeton est valide (signature, type, expiration, version) */
export async function readClientSession(token: string | undefined | null): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const secret = getSessionSecret("client");
  if (!secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(secret, payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      cid?: string;
      sv?: number;
      exp?: number;
    };
    if (!hasKind(json, "client") || !json.cid || !json.exp || json.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    const client = await prisma.client.findUnique({
      where: { id: json.cid },
      select: { id: true, sessionVersion: true },
    });
    if (!client || client.sessionVersion !== (json.sv ?? 0)) return null;
    return client.id;
  } catch {
    return null;
  }
}

/** Client connecté par email (lit le cookie de la requête en cours) */
export async function currentEmailClientId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return readClientSession(jar.get(COOKIE)?.value);
}
