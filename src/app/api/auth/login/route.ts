import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAll } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-next";
import {
  createVendorSessionToken,
  vendorCookieName,
  vendorCookieOptions,
  verifyVendorPassword,
} from "@/lib/vendor-auth";
import {
  adminCookieName,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { clientCookieName, clientCookieOptions, createClientSessionToken } from "@/lib/client-session";

/**
 * Connexion unique « email + mot de passe » du site : on reconnaît le rôle
 * et on renvoie vers le bon espace.
 *   - ADMIN_EMAIL + ADMIN_PASSWORD → back-office (/admin)
 *   - compte vendeur              → espace vendeur (/vendeur/espace)
 *   - compte client               → mon compte (/compte, ou la page demandée)
 * Réponse identique quel que soit le motif d'échec (pas d'indice sur l'email).
 */
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

const FAIL = { ok: false, error: "Email ou mot de passe incorrect." };

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(FAIL, { status: 400 });
  const { email, password, next } = parsed.data;

  const limited = await rateLimitAll([
    { key: `site-login:${clientIp(request)}`, limit: 20, windowMs: 15 * 60 * 1000 },
    { key: `site-login:email:${email}`, limit: 10, windowMs: 15 * 60 * 1000 },
  ]);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives. Réessaie dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  // 1) Administrateur (seulement si ADMIN_EMAIL est défini)
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email === adminEmail && isAdminPasswordConfigured() && verifyAdminPassword(password)) {
    const token = await createAdminSessionToken();
    if (!token) return NextResponse.json({ ok: false, error: "Back-office non configuré." }, { status: 503 });
    const res = NextResponse.json({ ok: true, role: "admin", next: "/admin" });
    res.cookies.set(adminCookieName(), token, adminCookieOptions());
    return res;
  }

  // 2) Vendeur, 3) client — mot de passe toujours vérifié (durée identique)
  const [vendor, client] = await Promise.all([
    prisma.vendor.findUnique({ where: { email }, omit: { passwordHash: false } }),
    prisma.client.findUnique({ where: { email }, omit: { passwordHash: false } }),
  ]);
  const vendorOk = verifyVendorPassword(password, vendor?.passwordHash);
  const clientOk = !vendorOk && verifyVendorPassword(password, client?.passwordHash);

  if (vendor && vendorOk) {
    if (vendor.statut === "suspendu") {
      return NextResponse.json({ ok: false, error: "Compte vendeur suspendu. Contacte Coin229." }, { status: 403 });
    }
    const token = createVendorSessionToken(vendor.id, vendor.sessionVersion);
    if (!token) return NextResponse.json({ ok: false, error: "Espace vendeur non configuré." }, { status: 503 });
    const res = NextResponse.json({
      ok: true,
      role: "vendor",
      next: safeNextPath(next, "/vendeur/espace", "/vendeur/espace"),
    });
    res.cookies.set(vendorCookieName(), token, vendorCookieOptions());
    return res;
  }

  if (client && clientOk) {
    const token = createClientSessionToken(client.id, client.sessionVersion);
    if (!token) return NextResponse.json({ ok: false, error: "Connexion indisponible." }, { status: 503 });
    const res = NextResponse.json({ ok: true, role: "client", next: safeNextPath(next, "/compte") });
    res.cookies.set(clientCookieName(), token, clientCookieOptions());
    return res;
  }

  return NextResponse.json(FAIL, { status: 401 });
}

/** Déconnexion du compte client email */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clientCookieName(), "", { ...clientCookieOptions(0), maxAge: 0 });
  return res;
}
