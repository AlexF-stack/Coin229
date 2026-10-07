/** Règles de commande partagées (aucune dépendance serveur) */

/** Délai pour payer une commande Mobile Money avant libération du stock */
export const MOBILE_MONEY_RESERVATION_MINUTES = 30;

/** cancelReason d'une commande annulée faute de paiement à temps */
export const PAYMENT_TIMEOUT_REASON = "payment_timeout";
