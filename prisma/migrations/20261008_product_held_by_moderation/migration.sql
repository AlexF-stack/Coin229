-- P2-9 : distinguer un produit archivé par la modération (vendeur en attente /
-- suspendu) d'un produit retiré volontairement par le vendeur.
ALTER TABLE "products" ADD COLUMN "held_by_moderation" BOOLEAN NOT NULL DEFAULT false;

-- Reprise de l'existant : produits archivés des vendeurs non actifs = en attente de modération
UPDATE "products" p
SET "held_by_moderation" = true
FROM "vendors" v
WHERE p."vendor_id" = v."id"
  AND p."statut" = 'archive'
  AND v."statut" IN ('en_attente', 'suspendu');
