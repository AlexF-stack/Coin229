-- Marketplace : KYC vendeur, reset MDP, commission/payout, rate-limit DB

ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "ifu" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "rccm" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "mobile_money" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "reset_token_hash" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "reset_token_expires" TIMESTAMP(3);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "commission_pct" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "commission_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "vendor_net" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refund_status" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payout_id" TEXT;

DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "vendor_payouts" (
  "id" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "statut" "PayoutStatus" NOT NULL DEFAULT 'pending',
  "note" TEXT,
  "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_paid" TIMESTAMP(3),
  CONSTRAINT "vendor_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vendor_payouts_vendor_id_statut_idx" ON "vendor_payouts"("vendor_id", "statut");

DO $$ BEGIN
  ALTER TABLE "vendor_payouts" ADD CONSTRAINT "vendor_payouts_vendor_id_fkey"
    FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "orders_payout_id_idx" ON "orders"("payout_id");

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_payout_id_fkey"
    FOREIGN KEY ("payout_id") REFERENCES "vendor_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill vendor_net for existing orders (subtotal ≈ total - shipping)
UPDATE "orders"
SET
  "vendor_net" = GREATEST(0, "montant_total" - "frais_livraison" - (("montant_total" - "frais_livraison") * "commission_pct" / 100)),
  "commission_amount" = (("montant_total" - "frais_livraison") * "commission_pct" / 100)
WHERE "vendor_net" = 0 AND "montant_total" > 0;

CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "window_start" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
