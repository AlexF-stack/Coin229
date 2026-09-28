/**
 * Vérif session vendeur compatible Edge (middleware) — Web Crypto only.
 */

const COOKIE = "coin229_vendor";

function getSessionSecret(): string | null {
  const custom =
    process.env.VENDOR_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();
  if (!custom) return null;
  return custom.length >= 8 ? custom : null;
}

function b64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function vendorCookieName() {
  return COOKIE;
}

export async function verifyVendorSessionTokenEdge(
  token: string | undefined | null
): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expected = b64urlEncode(mac);
  if (expected.length !== sig.length) return null;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (ok !== 0) return null;

  try {
    const pad =
      payload.length % 4 === 0 ? "" : "=".repeat(4 - (payload.length % 4));
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const json = JSON.parse(atob(b64)) as { vendorId?: string; exp?: number };
    if (
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
