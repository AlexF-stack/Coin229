/**
 * Ciblage des notifications push — chaque envoi vise un public précis.
 * - Nouvelle commande  → admin + le vendeur de la commande
 * - Nouveau vendeur    → admin
 * - Annonce marketing  → clients
 */
import type { Prisma, PushRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isGonePushError,
  isWebPushConfigured,
  sendPushToSubscription,
  type PushPayload,
} from "@/lib/web-push";

export type PushAudience = "client" | "admin" | "vendor";

export function pushWhere(target: {
  roles: PushRole[];
  vendorId?: string;
}): Prisma.PushSubscriptionWhereInput {
  const or: Prisma.PushSubscriptionWhereInput[] = [];
  for (const role of target.roles) {
    if (role === "vendor") {
      // Jamais tous les vendeurs : uniquement celui concerné
      if (target.vendorId) or.push({ role: "vendor", vendorId: target.vendorId });
    } else {
      or.push({ role });
    }
  }
  return or.length ? { OR: or } : { id: { in: [] } };
}

/** Envoie à la cible, purge les abonnements morts. Best-effort. */
export async function sendPushTo(
  target: { roles: PushRole[]; vendorId?: string },
  payload: PushPayload
): Promise<{ total: number; sent: number; failed: number }> {
  if (!isWebPushConfigured()) return { total: 0, sent: 0, failed: 0 };
  const subs = await prisma.pushSubscription.findMany({
    where: pushWhere(target),
    orderBy: { updatedAt: "desc" },
  });
  let sent = 0;
  let failed = 0;
  const goneIds: string[] = [];
  for (const sub of subs) {
    try {
      await sendPushToSubscription(sub, payload);
      sent++;
    } catch (err) {
      failed++;
      if (isGonePushError(err)) goneIds.push(sub.id);
    }
  }
  if (goneIds.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: goneIds } } });
  }
  return { total: subs.length, sent, failed };
}
