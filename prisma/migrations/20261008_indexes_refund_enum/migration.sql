-- P3-8 : statut de remboursement en enum + index des requêtes fréquentes

CREATE TYPE "RefundStatus" AS ENUM ('n/a', 'pending', 'done');
-- Une valeur inattendue ne doit pas bloquer la migration : elle est vidée
UPDATE "orders" SET "refund_status" = NULL
  WHERE "refund_status" IS NOT NULL AND "refund_status" NOT IN ('n/a', 'pending', 'done');
ALTER TABLE "orders" ALTER COLUMN "refund_status" TYPE "RefundStatus" USING "refund_status"::"RefundStatus";

-- Reversements / espace vendeur (remplace l'index sur vendor_id seul)
CREATE INDEX "orders_vendor_id_statut_payout_id_idx" ON "orders"("vendor_id", "statut", "payout_id");
DROP INDEX IF EXISTS "orders_vendor_id_idx";
-- Listes triées par date (admin)
CREATE INDEX "orders_date_creation_idx" ON "orders"("date_creation");
-- Catalogue
CREATE INDEX "products_statut_date_creation_idx" ON "products"("statut", "date_creation");
-- Conversations liées à un produit / une commande (et SET NULL à la suppression)
CREATE INDEX "conversations_product_id_idx" ON "conversations"("product_id");
CREATE INDEX "conversations_order_id_idx" ON "conversations"("order_id");
-- Lien de réinitialisation du mot de passe vendeur
CREATE INDEX "vendors_reset_token_hash_idx" ON "vendors"("reset_token_hash");
