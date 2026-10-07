-- Mot de passe oublié vendeur : demande traitée par l'admin (P1-15)
ALTER TABLE "vendors" ADD COLUMN "reset_requested_at" TIMESTAMP(3);
