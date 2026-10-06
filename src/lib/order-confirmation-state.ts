/**
 * Ce que la page de confirmation affiche, selon l'état RÉEL de la commande.
 * Indépendant du prestataire de paiement (Fedapay, KkiaPay, FeexPay…) :
 * seuls le mode de paiement, le statut et la possibilité de relancer comptent.
 */
import type { OrderStatus, PaymentMode } from "@prisma/client";

export type ConfirmationKind =
  | "paid" // Mobile Money payé (statut confirmé ou plus loin)
  | "payment_pending" // Mobile Money pas encore payé
  | "cod_received" // paiement à la livraison, commande reçue
  | "confirmed" // paiement à la livraison, commande confirmée par l'équipe
  | "cancelled";

export type ConfirmationState = {
  kind: ConfirmationKind;
  title: string;
  message: string;
  /** Lien pour (re)lancer le paiement, si possible */
  canRetryPayment: boolean;
};

export function getConfirmationState(order: {
  statut: OrderStatus;
  modePaiement: PaymentMode;
  paymentProvider: string | null;
  paymentUrl: string | null;
}): ConfirmationState {
  if (order.statut === "annulee") {
    return {
      kind: "cancelled",
      title: "Commande annulée",
      message:
        order.modePaiement === "mobile_money"
          ? "Cette commande a été annulée. Si un montant a été débité sur ton compte Mobile Money, écris-nous sur WhatsApp avec ce numéro de commande : nous te remboursons."
          : "Cette commande a été annulée. Écris-nous sur WhatsApp si c’est une erreur.",
      canRetryPayment: false,
    };
  }

  if (order.modePaiement === "mobile_money") {
    if (order.statut === "en_attente") {
      // Relance possible si le prestataire fournit un lien ou un widget
      const canRetryPayment =
        Boolean(order.paymentUrl) ||
        (order.paymentProvider !== null &&
          order.paymentProvider !== "mock");
      return {
        kind: "payment_pending",
        title: "Paiement en attente",
        message:
          "Ta commande est enregistrée, mais nous n’avons pas encore reçu la confirmation du paiement Mobile Money. Si tu viens de valider sur ton téléphone, actualise dans quelques instants.",
        canRetryPayment,
      };
    }
    return {
      kind: "paid",
      title: "Paiement reçu — commande confirmée !",
      message: "Merci. Notre équipe te contacte bientôt pour la livraison.",
      canRetryPayment: false,
    };
  }

  if (order.statut === "en_attente") {
    return {
      kind: "cod_received",
      title: "Commande reçue !",
      message:
        "Merci. Tu paieras à la livraison. Notre équipe te contacte bientôt pour confirmer et organiser la livraison.",
      canRetryPayment: false,
    };
  }

  return {
    kind: "confirmed",
    title: "Commande confirmée !",
    message: "Merci. Tu paieras à la livraison. Notre équipe te contacte bientôt.",
    canRetryPayment: false,
  };
}
