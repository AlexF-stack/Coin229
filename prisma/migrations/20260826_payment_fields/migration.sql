-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_provider" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_ref" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_url" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_payment_ref_key" ON "orders"("payment_ref");
