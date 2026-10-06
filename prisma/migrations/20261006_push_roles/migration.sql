-- Abonnements push ciblés par public (client / admin / vendeur).
-- Les abonnements existants deviennent « client » : l'admin et les vendeurs
-- réactivent leurs alertes depuis leur espace.

CREATE TYPE "PushRole" AS ENUM ('client', 'admin', 'vendor');

ALTER TABLE "push_subscriptions"
  ADD COLUMN "role" "PushRole" NOT NULL DEFAULT 'client',
  ADD COLUMN "vendor_id" TEXT;

DROP INDEX "push_subscriptions_endpoint_key";
CREATE UNIQUE INDEX "push_subscriptions_endpoint_role_key" ON "push_subscriptions"("endpoint", "role");
CREATE INDEX "push_subscriptions_role_idx" ON "push_subscriptions"("role");
CREATE INDEX "push_subscriptions_vendor_id_idx" ON "push_subscriptions"("vendor_id");

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
