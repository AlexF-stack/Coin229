-- Expiration des réservations Mobile Money non payées (P1-2)
ALTER TABLE "orders" ADD COLUMN "cancel_reason" TEXT;

CREATE INDEX "orders_statut_mode_paiement_date_creation_idx"
  ON "orders"("statut", "mode_paiement", "date_creation");
