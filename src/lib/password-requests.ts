import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { sendPushTo } from "@/lib/push-audience";
import { postOpsWebhook } from "@/lib/ops-webhook";
import { hashResetToken } from "@/lib/vendor-auth";

/**
 * « Mot de passe oublié » (vendeurs et clients) sans service d'email :
 * la demande est enregistrée et l'admin prévenu, SANS lien. L'admin vérifie
 * puis envoie un lien à usage unique (24 h) depuis le back-office.
 */
const ONE_HOUR = 60 * 60 * 1000;

function notifyAdmin(kind: "vendor" | "client", who: string, key: string) {
  const path = kind === "vendor" ? "/admin/vendeurs" : "/admin/clients";
  void postOpsWebhook({
    type: `${kind}.password_reset_request`,
    who,
    message: `Coin229 : ${who} demande un nouveau mot de passe. Vérifie puis envoie le lien depuis ${SITE.url}${path}`,
  }).catch(() => {});
  void sendPushTo(
    { roles: ["admin"] },
    {
      title: kind === "vendor" ? "Mot de passe vendeur" : "Mot de passe client",
      body: `${who} demande un nouveau mot de passe`,
      url: path,
      tag: `reset-${key}`,
    }
  ).catch(() => {});
}

/** Enregistre la demande pour cet email (vendeur ou client). Ne révèle jamais si l'email existe. */
export async function requestPasswordReset(email: string): Promise<void> {
  const [vendor, client] = await Promise.all([
    prisma.vendor.findUnique({ where: { email }, select: { id: true, nomBoutique: true, resetRequestedAt: true } }),
    prisma.client.findUnique({ where: { email }, select: { id: true, nom: true, resetRequestedAt: true, passwordHash: true } }),
  ]);
  if (vendor) {
    const recent = vendor.resetRequestedAt && Date.now() - vendor.resetRequestedAt.getTime() < ONE_HOUR;
    await prisma.vendor.update({ where: { id: vendor.id }, data: { resetRequestedAt: new Date() } });
    if (!recent) notifyAdmin("vendor", vendor.nomBoutique, vendor.id);
  }
  // Seulement les comptes client à mot de passe (Google / Facebook n'en ont pas)
  if (client?.passwordHash) {
    const recent = client.resetRequestedAt && Date.now() - client.resetRequestedAt.getTime() < ONE_HOUR;
    await prisma.client.update({ where: { id: client.id }, data: { resetRequestedAt: new Date() } });
    if (!recent) notifyAdmin("client", `${client.nom} (${email})`, client.id);
  }
}

/** Lien de nouveau mot de passe pour un client (admin) — seul le hash est stocké */
export async function createClientResetToken(clientId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.client.update({
    where: { id: clientId },
    data: {
      resetTokenHash: hashResetToken(token),
      resetTokenExpires: new Date(Date.now() + 24 * ONE_HOUR),
      resetRequestedAt: null,
    },
  });
  return `${SITE.url}/compte/reinitialiser?token=${token}`;
}
