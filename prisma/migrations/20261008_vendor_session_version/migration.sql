-- P2-7 : révocation des sessions vendeur (changement de mot de passe)
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 0;
