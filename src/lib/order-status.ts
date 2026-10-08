/**
 * Changement de statut de commande (vendeur ou admin), selon
 * src/lib/order-status-rules.ts. Le stock n'est rendu qu'une seule fois.
 */
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  allowedNextStatuses,
  isPaidOnline,
  type StatusActor,
} from "@/lib/order-status-rules";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export async function changeOrderStatus(opts: {
  orderId: string;
  to: OrderStatus;
  actor: StatusActor;
  /** Pour un vendeur : la commande doit lui appartenir */
  vendorId?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: opts.orderId,
        ...(opts.actor === "vendor" ? { vendorId: opts.vendorId ?? "" } : {}),
      },
      include: { items: true },
    });
    if (!order) return { success: false as const, error: "Commande introuvable" };

    if (order.payoutId) {
      return {
        success: false as const,
        error: "Commande déjà reversée au vendeur : statut verrouillé.",
      };
    }
    if (!allowedNextStatuses(order, opts.actor).includes(opts.to)) {
      return {
        success: false as const,
        error: `Passage impossible : « ${ORDER_STATUS_LABELS[order.statut]} » → « ${ORDER_STATUS_LABELS[opts.to]} ».`,
      };
    }

    // Garde de concurrence : on ne change que si le statut n'a pas bougé
    const updated = await tx.order.updateMany({
      where: { id: order.id, statut: order.statut, payoutId: null },
      data:
        opts.to === "annulee"
          ? {
              statut: "annulee",
              cancelReason: opts.actor,
              refundStatus: isPaidOnline(order) ? "pending" : "not_applicable",
            }
          : { statut: opts.to },
    });
    if (updated.count === 0) {
      return {
        success: false as const,
        error: "La commande vient d’être modifiée. Actualise la page.",
      };
    }

    if (opts.to === "annulee") {
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
    }
    return { success: true as const };
  });
}
