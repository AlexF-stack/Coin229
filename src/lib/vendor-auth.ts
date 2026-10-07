/**
 * Auth vendeur marketplace — cookie session HMAC + password scrypt.
 */

import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { getSessionSecret as getKindSecret, hasKind, signingInput } from "@/lib/session-secrets";

const COOKIE = "coin229_vendor";
const MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 jours

function getSessionSecret(): string | null {
  return getKindSecret("vendor");
}

function b64urlEncode(data: Buffer | Uint8Array): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function vendorCookieName() {
  return COOKIE;
}

export function vendorCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function hashVendorPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyVendorPassword(
  password: string,
  stored: string | null | undefined
): boolean {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const parts = stored.split("$");
  const saltHex = parts[1];
  const hashHex = parts[2];
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** Jeton de réinitialisation : seul son hash SHA-256 est stocké */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function slugifyBoutique(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "boutique";
}

export function createVendorSessionToken(vendorId: string): string | null {
  const secret = getSessionSecret();
  if (!secret || !vendorId) return null;
  const now = Math.floor(Date.now() / 1000);
  const payload = b64urlEncode(
    Buffer.from(
      JSON.stringify({ v: 2, typ: "vendor", vendorId, iat: now, exp: now + MAX_AGE_SEC })
    )
  );
  const hmac = createHmac("sha256", secret)
    .update(signingInput("vendor", payload))
    .digest();
  return `${payload}.${b64urlEncode(hmac)}`;
}

export function readVendorSessionToken(
  token: string | undefined | null
): string | null {
  if (!token || !token.includes(".")) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret)
    .update(signingInput("vendor", payload))
    .digest();
  let given: Buffer;
  try {
    given = b64urlDecode(sig);
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }
  try {
    const json = JSON.parse(b64urlDecode(payload).toString("utf8")) as {
      vendorId?: string;
      exp?: number;
    };
    if (
      !hasKind(json, "vendor") ||
      !json.vendorId ||
      !json.exp ||
      json.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return json.vendorId;
  } catch {
    return null;
  }
}

export function safeVendorNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/vendeur/espace")) return "/vendeur/espace";
  if (next.startsWith("//") || next.includes("://")) return "/vendeur/espace";
  return next;
}

export function nicheToCategorie(
  niche: string
): "montre" | "bijou" | "sac" | "lunette" | "chaussure" {
  // Liste fixe (VENDOR_NICHE_OPTIONS) — évite le mapping magique trompeur.
  const n = niche.trim().toLowerCase();
  if (n === "montre luxe" || n === "montre") return "montre";
  if (n === "bijou") return "bijou";
  if (n === "lunette") return "lunette";
  if (n === "sandale luxe" || n === "sandale") return "chaussure";
  if (n === "sac") return "sac";
  // Fallback legacy (anciens produits texte libre)
  if (/montre|watch|horloge/.test(n)) return "montre";
  if (/bijou|bague|collier|bracelet|boucle/.test(n)) return "bijou";
  if (/lunette|soleil|optic/.test(n)) return "lunette";
  if (/chaussure|sandale|claquette|mule|slipper|sneaker|basket/.test(n))
    return "chaussure";
  if (/sac|sacoche|pochett|\bbag\b/.test(n)) return "sac";
  return "sac";
}

