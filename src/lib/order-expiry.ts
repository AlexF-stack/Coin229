/**
 * Réservations Mobile Money : une commande non payée bloque le stock.
 * Passé le délai, elle est annulée et son stock remis en vente.
 *
 * Déclenchement : à chaque commande et consultation du catalogue (au plus
 * une fois par minute et par instance) + tâche planifiée Vercel (filet).
 */
import { prisma } from "@/lib/prisma";
import {
  MOBILE_MONEY_RESERVATION_MINUTES,
  PAYMENT_TIMEOUT_REASON,
} from "@/lib/order-rules";

export { MOBILE_MONEY_RESERVATION_MINUTES, PAYMENT_TIMEOUT_REASON };

const THROTTLE_MS = 60_000;
let lastRun = 0;

/** Annule les commandes Mobile Money non payées à temps et rend leur stock */
export async function releaseExpiredReservations(now = new Date()): Promise<number> {
  const limit = new Date(now.getTime() - MOBILE_MONEY_RESERVATION_MINUTES * 60_000);
  const expired = await prisma.order.findMany({
    where: {
      statut: "en_attente",
      modePaiement: "mobile_money",
      dateCreation: { lt: limit },
    },
    select: { id: true, items: { select: { productId: true, quantite: true } } },
    take: 50,
    orderBy: { dateCreation: "asc" },
  });

  let released = 0;
  for (const order of expired) {
    const done = await prisma.$transaction(async (tx) => {
      // Garde : seulement si toujours en attente (un paiement a pu arriver)
      const cancelled = await tx.order.updateMany({
        where: { id: order.id, statut: "en_attente" },
        data: { statut: "annulee", cancelReason: PAYMENT_TIMEOUT_REASON },
      });
      if (cancelled.count === 0) return false;
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantite: { increment: item.quantite } },
        });
        // Remis en vente seulement s'il était en rupture (jamais un produit archivé)
        await tx.product.updateMany({
          where: { id: item.productId, statut: "rupture", stockQuantite: { gt: 0 } },
          data: { statut: "actif" },
        });
      }
      return true;
    });
    if (done) released++;
  }
  return released;
}

/** Version « au fil de l'eau » : au plus une fois par minute, ne bloque jamais */
export async function maybeReleaseExpiredReservations(): Promise<void> {
  const now = Date.now();
  if (now - lastRun < THROTTLE_MS) return;
  lastRun = now;
  try {
    await releaseExpiredReservations();
  } catch (err) {
    console.error("[order-expiry]", err);
  }
}

/**
 * Paiement reçu APRÈS l'expiration : on tente de re-réserver le stock.
 * Succès → commande confirmée ; sinon → remboursement à faire (admin).
 */
export async function recoverExpiredPaidOrder(opts: {
  orderId: string;
  provider: string;
  paymentRef: string;
}): Promise<"confirmed" | "refund_needed"> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: opts.orderId },
        select: { statut: true, cancelReason: true, items: true },
      });
      if (!order || order.statut !== "annulee" || order.cancelReason !== PAYMENT_TIMEOUT_REASON) {
        throw new Error("NOT_EXPIRED_ORDER");
      }
      for (const item of order.items) {
        const reserved = await tx.product.updateMany({
          where: { id: item.productId, stockQuantite: { gte: item.quantite } },
          data: { stockQuantite: { decrement: item.quantite } },
        });
        if (reserved.count === 0) throw new Error("OUT_OF_STOCK");
        await tx.product.updateMany({
          where: { id: item.productId, stockQuantite: 0, statut: "actif" },
          data: { statut: "rupture" },
        });
      }
      await tx.order.update({
        where: { id: opts.orderId },
        data: {
          statut: "confirmee",
          cancelReason: null,
          paymentRef: opts.paymentRef,
          paymentProvider: opts.provider,
        },
      });
      return "confirmed" as const;
    });
  } catch (err) {
    if (!(err instanceof Error) || err.message !== "OUT_OF_STOCK") throw err;
    // Stock reparti entre-temps : le client a payé, il faut le rembourser
    console.warn("[order-expiry] paiement après expiration, remboursement à faire", opts.orderId, err);
    await prisma.order.update({
      where: { id: opts.orderId },
      data: {
        refundStatus: "pending",
        paymentRef: opts.paymentRef,
        paymentProvider: opts.provider,
      },
    });
    return "refund_needed";
  }
}
