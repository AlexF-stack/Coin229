import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import { hashResetToken, hashVendorPassword } from "@/lib/vendor-auth";
import { clientCookieName, clientCookieOptions, createClientSessionToken } from "@/lib/client-session";

/** Nouveau mot de passe client via le lien envoyé par l'admin (usage unique, 24 h) */
const schema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(200),
});

export async function POST(request: Request) {
  const limited = await rateLimitAsync({ key: `client-reset:${clientIp(request)}`, limit: 12, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessaie plus tard." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { resetTokenHash: hashResetToken(parsed.data.token), resetTokenExpires: { gt: new Date() } },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ ok: false, error: "Lien invalide ou expiré. Demande un nouveau lien." }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      passwordHash: hashVendorPassword(parsed.data.password),
      resetTokenHash: null,
      resetTokenExpires: null,
      resetRequestedAt: null,
      // Déconnecte les sessions ouvertes avec l'ancien mot de passe
      sessionVersion: { increment: 1 },
    },
    select: { id: true, sessionVersion: true },
  });

  // Connecté directement avec le nouveau mot de passe
  const token = createClientSessionToken(updated.id, updated.sessionVersion);
  const res = NextResponse.json({ ok: true, next: "/compte" });
  if (token) res.cookies.set(clientCookieName(), token, clientCookieOptions());
  return res;
}
