/**
 * Reversements vendeurs — règle unique d'éligibilité, partagée par l'écran
 * admin, la création du reversement et les finances du vendeur.
 *
 * Éligible = commande LIVRÉE (paiement à la livraison : encaissement confirmé
 * par l'admin ; Mobile Money : payée et livrée), pas encore reversée, sans
 * remboursement en attente.
 */
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function payableOrderWhere(vendorId?: string): Prisma.OrderWhereInput {
  return {
    ...(vendorId ? { vendorId } : {}),
    statut: "livree",
    payoutId: null,
    vendorNet: { gt: 0 },
    OR: [{ refundStatus: null }, { refundStatus: { not: "pending" } }],
  };
}

/** Commandes réellement vendues : payées / acceptées, hors attente de paiement et annulations */
export const SOLD_STATUSES: OrderStatus[] = ["confirmee", "en_livraison", "livree"];

/**
 * Crée un reversement pour un vendeur. Atomique : chaque commande n'est
 * rattachée que si elle est toujours non reversée ; sinon tout est annulé.
 * `expectedAmount` = montant affiché à l'admin, refusé s'il a changé.
 */
export async function createPayoutForVendor(opts: {
  vendorId: string;
  expectedAmount: number;
  note?: string;
}): Promise<
  | { success: true; payoutId: string; amount: number; orderCount: number }
  | { success: false; error: string }
> {
  try {
    return await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: payableOrderWhere(opts.vendorId),
        select: { id: true, vendorNet: true },
      });
      if (!orders.length) {
        return { success: false as const, error: "Rien à reverser pour ce vendeur." };
      }
      const amount = orders.reduce((s, o) => s + o.vendorNet, 0);
      if (amount !== opts.expectedAmount) {
        return {
          success: false as const,
          error: `Le montant a changé (${amount.toLocaleString("fr-FR")} FCFA au lieu de ${opts.expectedAmount.toLocaleString("fr-FR")}). Actualise la page avant de reverser.`,
        };
      }
      const payout = await tx.vendorPayout.create({
        data: {
          vendorId: opts.vendorId,
          amount,
          statut: "paid",
          note: opts.note?.trim().slice(0, 200) || "Reversement manuel",
          datePaid: new Date(),
        },
      });
      // Garde anti-doublon : seulement les commandes encore non reversées
      const attached = await tx.order.updateMany({
        where: { id: { in: orders.map((o) => o.id) }, ...payableOrderWhere(opts.vendorId) },
        data: { payoutId: payout.id },
      });
      if (attached.count !== orders.length) throw new Error("ALREADY_PAID_OUT");
      return {
        success: true as const,
        payoutId: payout.id,
        amount,
        orderCount: orders.length,
      };
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_PAID_OUT") {
      return {
        success: false,
        error: "Ces commandes viennent d’être reversées (double clic ou autre admin). Actualise la page.",
      };
    }
    throw err;
  }
}

/** Synthèse financière d'un vendeur, sur TOUTES ses commandes */
export async function getVendorFinanceSummary(vendorId: string) {
  const [sold, payable, inProgress] = await Promise.all([
    prisma.order.aggregate({
      where: { vendorId, statut: { in: SOLD_STATUSES } },
      _sum: { montantTotal: true, fraisLivraison: true, commissionAmount: true, vendorNet: true },
    }),
    prisma.order.aggregate({
      where: payableOrderWhere(vendorId),
      _sum: { vendorNet: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { vendorId, statut: { in: ["confirmee", "en_livraison"] }, payoutId: null },
      _sum: { vendorNet: true },
    }),
  ]);
  return {
    /** Ventes hors frais de livraison */
    brut: (sold._sum.montantTotal ?? 0) - (sold._sum.fraisLivraison ?? 0),
    commission: sold._sum.commissionAmount ?? 0,
    net: sold._sum.vendorNet ?? 0,
    /** Prêt à être reversé (livré, non reversé) */
    pendingPayout: payable._sum.vendorNet ?? 0,
    pendingPayoutOrders: payable._count,
    /** Vendu mais pas encore livré : reversable après livraison */
    inProgress: inProgress._sum.vendorNet ?? 0,
  };
}
