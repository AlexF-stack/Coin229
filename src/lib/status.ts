import type { OrderStatus, PayoutStatus, ProductStatus, RefundStatus, VendorStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

/**
 * Statuts Coin229 — SOURCE UNIQUE des libellés et des couleurs de statut.
 * Les couleurs d'état (success, warning, error, info, neutral) ne remplacent
 * jamais les couleurs de marque.
 */
export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

type StatusDef = { label: string; tone: StatusTone };

export const ORDER_STATUS: Record<OrderStatus, StatusDef> = {
  en_attente: { label: ORDER_STATUS_LABELS.en_attente, tone: "warning" },
  confirmee: { label: ORDER_STATUS_LABELS.confirmee, tone: "info" },
  en_livraison: { label: ORDER_STATUS_LABELS.en_livraison, tone: "info" },
  livree: { label: ORDER_STATUS_LABELS.livree, tone: "success" },
  annulee: { label: ORDER_STATUS_LABELS.annulee, tone: "neutral" },
};

export const PRODUCT_STATUS: Record<ProductStatus, StatusDef> = {
  actif: { label: "En vente", tone: "success" },
  rupture: { label: "Épuisé", tone: "warning" },
  archive: { label: "Retiré", tone: "neutral" },
};

export const VENDOR_STATUS: Record<VendorStatus, StatusDef> = {
  actif: { label: "Actif", tone: "success" },
  en_attente: { label: "En attente", tone: "warning" },
  suspendu: { label: "Suspendu", tone: "error" },
};

export const PAYOUT_STATUS: Record<PayoutStatus, StatusDef> = {
  pending: { label: "En attente", tone: "warning" },
  paid: { label: "Payé", tone: "success" },
  cancelled: { label: "Annulé", tone: "neutral" },
};

export const REFUND_STATUS: Record<RefundStatus, StatusDef> = {
  pending: { label: "Remboursement à faire", tone: "warning" },
  done: { label: "Remboursé", tone: "neutral" },
  not_applicable: { label: "Rien à rembourser", tone: "neutral" },
};

export const STATUS_MAPS = {
  order: ORDER_STATUS,
  product: PRODUCT_STATUS,
  vendor: VENDOR_STATUS,
  payout: PAYOUT_STATUS,
  refund: REFUND_STATUS,
} as const;

export type StatusKind = keyof typeof STATUS_MAPS;
