-- Bénin : passage des numéros à 10 chiffres (nov. 2024).
-- Ancien format stocké « +229XXXXXXXX » → « +22901XXXXXXXX » (préfixe 01 officiel).
-- Idempotent : ne touche que les numéros encore au format 8 chiffres.

-- Clients : on ne convertit pas si le numéro converti existe déjà (contrainte unique).
UPDATE "clients" AS c
SET "telephone" = '+22901' || substring(c."telephone" FROM 5)
WHERE c."telephone" ~ '^\+229[0-9]{8}$'
  AND NOT EXISTS (
    SELECT 1 FROM "clients" AS d
    WHERE d."telephone" = '+22901' || substring(c."telephone" FROM 5)
  );

-- Commandes : le numéro de livraison suit le même format.
UPDATE "orders"
SET "telephone" = '+22901' || substring("telephone" FROM 5)
WHERE "telephone" ~ '^\+229[0-9]{8}$';
