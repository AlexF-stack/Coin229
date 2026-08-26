# Coin229 — prêt production

Boutique e-commerce accessoires mode (Bénin) · Next.js 15 · Prisma · Supabase · Vercel.

## Lancer en local

```bash
cp .env.example .env
# Éditer ADMIN_PASSWORD et NEXT_PUBLIC_WHATSAPP_NUMBER au minimum

npm install
npm run dev
```

- Boutique : http://localhost:3000  
- Admin : http://localhost:3000/admin (mot de passe = `ADMIN_PASSWORD`)

Sans base Postgres, le catalogue démo s’affiche automatiquement.

## Brancher la base (Supabase)

1. Créer un projet Supabase  
2. Renseigner `DATABASE_URL`, `DIRECT_URL`, clés Auth dans `.env`  
3. Appliquer le schéma :

```bash
npx prisma migrate deploy
npm run db:seed
```

4. (Optionnel) Activer Phone Auth OTP SMS dans Supabase
5. (Optionnel) Google + Facebook : Authentication → Providers, redirect `…/auth/callback`

## Auth sociale

Sur `/compte` : Google, Facebook (OAuth Supabase) et SMS. Configurer les apps Google Cloud / Meta avec le callback fourni par Supabase.

## Déployer sur Vercel

1. Importer le repo Git  
2. Variables d’environnement = celles de `.env.example`  
3. Build command : `prisma generate && next build` (déjà dans `npm run build`)  
4. Deploy

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Dev local |
| `npm run build` | Build production |
| `npm start` | Serveur prod |
| `npm run db:seed` | Données initiales |
| `npm run db:push` | Sync schéma (dev) |

## Structure

```
src/app/          Boutique + admin + API
src/components/   UI boutique / admin séparés
src/lib/          Shipping, paiement mock, Prisma, cart
prisma/           Schema + migrations + seed
```

## Chatbot

Assistant boutique intégré (livraison, paiement, zones, commandes) avec bascule WhatsApp.
Visible sur la boutique uniquement — pas dans l’admin.

## Paiement

- **COD** : toujours disponible
- **Fedapay** : si `FEDAPAY_SECRET_KEY` → transaction + redirect checkout
- **KkiaPay** : si clés publiques/privées → widget sur `/commande/paiement`
- Callbacks : `/api/payments/fedapay/callback`, `/api/payments/kkiapay/webhook`

## Base de données

Postgres Neon (claimable) branchée en local + Vercel. **Réclame la DB** (lien claim) sous 72 h pour la garder.
`npx prisma migrate deploy && npm run db:seed`

## Sécurité admin

Définis un `ADMIN_PASSWORD` fort en production. Ne partage jamais ce mot de passe côté client.
