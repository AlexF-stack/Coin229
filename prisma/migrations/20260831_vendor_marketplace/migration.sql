-- AlterTable vendors
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "logo_url" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "vendors_email_key" ON "vendors"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "vendors_slug_key" ON "vendors"("slug");

-- AlterTable products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "niche" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "products_niche_idx" ON "products"("niche");

-- Seed slug for existing Coin229 boutique
UPDATE "vendors"
SET "slug" = 'coin229'
WHERE "id" = 'vendor_coin229_local' AND ("slug" IS NULL OR "slug" = '');
