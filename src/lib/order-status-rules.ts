/**
 * Transitions de statut de commande autorisées — source unique, utilisée
 * par le serveur (contrôle) et par les écrans (seuls les choix permis).
 *
 * Règles :
 * - Mobile Money : seul le paiement vérifié (ou l'admin) confirme la commande.
 * - Paiement à la livraison : seul l'admin passe en « livrée » (= argent encaissé).
 * - « annulée » est définitive ; une commande déjà reversée au vendeur est verrouillée.
 */
import type { OrderStatus, PaymentMode } from "@prisma/client";

export type StatusActor = "vendor" | "admin";

type OrderForRules = {
  statut: OrderStatus;
  modePaiement: PaymentMode;
  payoutId: string | null;
};

const VENDOR: Record<PaymentMode, Partial<Record<OrderStatus, OrderStatus[]>>> = {
  mobile_money: {
    en_attente: ["annulee"], // non payée : le vendeur peut l'abandonner
    confirmee: ["en_livraison"],
    en_livraison: ["livree"],
  },
  livraison: {
    en_attente: ["confirmee", "annulee"],
    confirmee: ["en_livraison", "annulee"],
    en_livraison: ["annulee"], // livraison échouée ; « livrée » = admin (encaissement)
  },
};

const ADMIN: Record<PaymentMode, Partial<Record<OrderStatus, OrderStatus[]>>> = {
  mobile_money: {
    en_attente: ["confirmee", "annulee"], // confirmer = paiement vérifié à la main
    confirmee: ["en_livraison", "livree", "annulee"],
    en_livraison: ["livree", "annulee"],
    livree: ["annulee"], // retour / remboursement
  },
  livraison: {
    en_attente: ["confirmee", "annulee"],
    confirmee: ["en_livraison", "livree", "annulee"],
    en_livraison: ["livree", "annulee"],
    livree: ["annulee"],
  },
};

export function allowedNextStatuses(
  order: OrderForRules,
  actor: StatusActor
): OrderStatus[] {
  if (order.payoutId) return []; // déjà reversée au vendeur
  const table = actor === "admin" ? ADMIN : VENDOR;
  return table[order.modePaiement][order.statut] ?? [];
}

/** Une commande Mobile Money qui n'est plus « en attente » a été payée */
export function isPaidOnline(order: Pick<OrderForRules, "statut" | "modePaiement">) {
  return order.modePaiement === "mobile_money" && order.statut !== "en_attente";
}

export const STATUS_ACTION_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  confirmee: "Confirmer",
  en_livraison: "Passer en livraison",
  livree: "Marquer livrée",
  annulee: "Annuler",
};
