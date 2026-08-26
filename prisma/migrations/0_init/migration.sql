-- Migration initiale Coin229
-- Appliquer via: npx prisma migrate dev --name init
-- ou coller dans le SQL Editor Supabase puis: npx prisma db pull / prisma generate

CREATE TYPE "VendorStatus" AS ENUM ('actif', 'en_attente', 'suspendu');
CREATE TYPE "Categorie" AS ENUM ('montre', 'bijou', 'sac');
CREATE TYPE "Genre" AS ENUM ('homme', 'femme', 'unisexe');
CREATE TYPE "ProductSource" AS ENUM ('local', 'chine');
CREATE TYPE "ProductStatus" AS ENUM ('actif', 'rupture', 'archive');
CREATE TYPE "DeliveryZone" AS ENUM ('cotonou', 'porto_novo', 'godomey');
CREATE TYPE "OrderStatus" AS ENUM ('en_attente', 'confirmee', 'en_livraison', 'livree', 'annulee');
CREATE TYPE "PaymentMode" AS ENUM ('mobile_money', 'livraison');

CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "nom_boutique" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "statut" "VendorStatus" NOT NULL DEFAULT 'en_attente',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categorie" "Categorie" NOT NULL,
    "genre" "Genre" NOT NULL,
    "prix" INTEGER NOT NULL,
    "prix_promo" INTEGER,
    "stock_quantite" INTEGER NOT NULL,
    "source" "ProductSource" NOT NULL DEFAULT 'local',
    "images" TEXT[],
    "statut" "ProductStatus" NOT NULL DEFAULT 'actif',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "auth_id" TEXT,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clients_telephone_key" ON "clients"("telephone");
CREATE UNIQUE INDEX "clients_auth_id_key" ON "clients"("auth_id");

CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "zone" "DeliveryZone" NOT NULL,
    "adresse_complete" TEXT NOT NULL,
    "est_principale" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "statut" "OrderStatus" NOT NULL DEFAULT 'en_attente',
    "mode_paiement" "PaymentMode" NOT NULL,
    "zone_livraison" "DeliveryZone" NOT NULL,
    "frais_livraison" INTEGER NOT NULL,
    "montant_total" INTEGER NOT NULL,
    "telephone" TEXT NOT NULL,
    "nom_client" TEXT NOT NULL,
    "adresse_livraison" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire_au_moment_commande" INTEGER NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_config" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_config_cle_key" ON "app_config"("cle");

CREATE INDEX "products_vendor_id_idx" ON "products"("vendor_id");
CREATE INDEX "products_categorie_genre_statut_idx" ON "products"("categorie", "genre", "statut");
CREATE INDEX "addresses_client_id_idx" ON "addresses"("client_id");
CREATE INDEX "orders_client_id_idx" ON "orders"("client_id");
CREATE INDEX "orders_vendor_id_idx" ON "orders"("vendor_id");
CREATE INDEX "orders_statut_idx" ON "orders"("statut");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
