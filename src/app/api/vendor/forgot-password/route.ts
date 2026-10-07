import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";
import { sendPushTo } from "@/lib/push-audience";

/**
 * « Mot de passe oublié » vendeur : la demande est enregistrée et l'admin
 * prévenu (SANS lien). L'admin vérifie l'identité puis envoie un lien à usage
 * unique sur le WhatsApp du vendeur depuis Admin → Vendeurs.
 * Réponse identique que l'email existe ou non (pas d'énumération).
 */
const schema = z.object({
  email: z.string().trim().email().max(120),
});

export async function POST(request: Request) {
  const limited = await rateLimitAsync({
    key: `vendor-forgot:${clientIp(request)}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const vendor = await prisma.vendor.findUnique({
    where: { email },
    select: { id: true, nomBoutique: true, resetRequestedAt: true },
  });
  if (!vendor) return NextResponse.json({ ok: true });

  // Une seule alerte admin par heure et par vendeur (évite le spam)
  const alreadyRecent =
    vendor.resetRequestedAt &&
    Date.now() - vendor.resetRequestedAt.getTime() < 60 * 60 * 1000;
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { resetRequestedAt: new Date() },
  });

  if (!alreadyRecent) {
    const adminUrl = `${SITE.url}/admin/vendeurs`;
    const hook = process.env.ORDER_NOTIFY_WEBHOOK?.trim();
    if (hook) {
      void fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "vendor.password_reset_request",
          boutique: vendor.nomBoutique,
          message: `Coin229 : ${vendor.nomBoutique} demande un nouveau mot de passe. Vérifie son identité puis envoie le lien depuis ${adminUrl}`,
        }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    }
    void sendPushTo(
      { roles: ["admin"] },
      {
        title: "Mot de passe vendeur",
        body: `${vendor.nomBoutique} demande un nouveau mot de passe`,
        url: "/admin/vendeurs",
        tag: `vendor-reset-${vendor.id}`,
      }
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
