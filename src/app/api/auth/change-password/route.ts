import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import {
  createVendorSessionToken,
  hashVendorPassword,
  readVendorSession,
  vendorCookieName,
  vendorCookieOptions,
  verifyVendorPassword,
} from "@/lib/vendor-auth";
import { clientCookieName, clientCookieOptions, createClientSessionToken, readClientSession } from "@/lib/client-session";

/**
 * Changer son mot de passe une fois connecté (vendeur ou client email).
 * Les autres appareils sont déconnectés ; celui-ci reste connecté.
 */
const schema = z.object({
  current: z.string().min(1, "Indique ton mot de passe actuel").max(200),
  password: z.string().min(8, "Nouveau mot de passe : 8 caractères minimum").max(200),
});

export async function POST(request: Request) {
  const limited = await rateLimitAsync({ key: `change-pw:${clientIp(request)}`, limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessaie dans quelques minutes." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  }
  const { current, password } = parsed.data;
  if (current === password) {
    return NextResponse.json({ ok: false, error: "Le nouveau mot de passe doit être différent de l’actuel." }, { status: 400 });
  }
  const jar = await cookies();
  const wrong = NextResponse.json({ ok: false, error: "Mot de passe actuel incorrect." }, { status: 401 });

  // Vendeur
  const vs = readVendorSession(jar.get(vendorCookieName())?.value);
  if (vs) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vs.vendorId }, omit: { passwordHash: false } });
    if (!vendor || vendor.sessionVersion !== vs.sessionVersion) {
      return NextResponse.json({ ok: false, error: "Session expirée, reconnecte-toi." }, { status: 401 });
    }
    if (!verifyVendorPassword(current, vendor.passwordHash)) return wrong;
    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: { passwordHash: hashVendorPassword(password), sessionVersion: { increment: 1 } },
      select: { id: true, sessionVersion: true },
    });
    const res = NextResponse.json({ ok: true });
    const token = createVendorSessionToken(updated.id, updated.sessionVersion);
    if (token) res.cookies.set(vendorCookieName(), token, vendorCookieOptions());
    return res;
  }

  // Client connecté par email
  const clientId = await readClientSession(jar.get(clientCookieName())?.value);
  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, omit: { passwordHash: false } });
    if (!client) return NextResponse.json({ ok: false, error: "Session expirée, reconnecte-toi." }, { status: 401 });
    if (!verifyVendorPassword(current, client.passwordHash)) return wrong;
    const updated = await prisma.client.update({
      where: { id: client.id },
      data: { passwordHash: hashVendorPassword(password), sessionVersion: { increment: 1 } },
      select: { id: true, sessionVersion: true },
    });
    const res = NextResponse.json({ ok: true });
    const token = createClientSessionToken(updated.id, updated.sessionVersion);
    if (token) res.cookies.set(clientCookieName(), token, clientCookieOptions());
    return res;
  }

  return NextResponse.json({ ok: false, error: "Connecte-toi pour changer ton mot de passe." }, { status: 401 });
}
