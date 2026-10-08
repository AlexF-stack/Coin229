import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import { hashVendorPassword } from "@/lib/vendor-auth";
import { clientCookieName, clientCookieOptions, createClientSessionToken } from "@/lib/client-session";

/**
 * Création d'un compte client email + mot de passe (alternative au SMS).
 * Le téléphone n'est pas demandé ici : un numéro non vérifié ne doit pas
 * donner accès aux commandes passées avec ce numéro.
 */
const schema = z.object({
  nom: z.string().trim().min(2, "Indique ton nom").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(200),
});

export async function POST(request: Request) {
  const limited = await rateLimitAsync({
    key: `client-register:${clientIp(request)}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "Trop d’inscriptions depuis cette connexion. Réessaie plus tard." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Vérifie les champs." }, { status: 400 });
  }
  const { nom, email, password } = parsed.data;

  const [client, vendor] = await Promise.all([
    prisma.client.findUnique({ where: { email }, select: { id: true } }),
    prisma.vendor.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (vendor) {
    return NextResponse.json(
      { ok: false, error: "Cet email est celui d’un compte vendeur : connecte-toi directement avec." },
      { status: 409 }
    );
  }
  if (client) {
    // Compte existant (Google / Facebook ou déjà inscrit) : pas de mot de passe ajouté sans preuve
    return NextResponse.json(
      { ok: false, error: "Un compte existe déjà avec cet email : connecte-toi (ou avec Google si tu l’as utilisé)." },
      { status: 409 }
    );
  }

  let created;
  try {
    created = await prisma.client.create({
      data: { nom, email, passwordHash: hashVendorPassword(password), telephone: null },
      select: { id: true, sessionVersion: true },
    });
  } catch {
    // Inscription simultanée avec le même email
    return NextResponse.json({ ok: false, error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const token = createClientSessionToken(created.id, created.sessionVersion);
  const res = NextResponse.json({ ok: true, next: "/compte" });
  if (token) res.cookies.set(clientCookieName(), token, clientCookieOptions());
  return res;
}
