-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('client', 'vendor');

-- CreateTable
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "product_id" TEXT,
    "order_id" TEXT,
    "subject" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_unread" INTEGER NOT NULL DEFAULT 0,
    "vendor_unread" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_vendor_id_client_id_key" ON "conversations"("vendor_id", "client_id");
CREATE INDEX IF NOT EXISTS "conversations_vendor_id_last_message_at_idx" ON "conversations"("vendor_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "conversations_client_id_last_message_at_idx" ON "conversations"("client_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
