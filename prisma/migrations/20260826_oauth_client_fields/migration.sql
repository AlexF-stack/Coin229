-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "telephone" DROP NOT NULL;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "email" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "clients_email_key" ON "clients"("email");
