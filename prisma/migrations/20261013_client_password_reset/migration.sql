-- Mot de passe oublié (client email)
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "reset_token_hash" TEXT;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "reset_token_expires" TIMESTAMP(3);
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "reset_requested_at" TIMESTAMP(3);
