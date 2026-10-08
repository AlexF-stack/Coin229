-- Connexion client par email + mot de passe
ALTER TABLE "clients" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "clients" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
