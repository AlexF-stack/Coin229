# Audit Coin229 — suivi des corrections

> Audit réalisé le **05/10/2026** sur la branche `audit-production` (base : `main` @ `465903c`).
> Ce fichier sert de **tableau de bord** : chaque correction est cochée ici au fur et à mesure.
> Aucune modification de code n'a été faite pendant l'audit.

**Légende statut** : ⬜ À faire · 🔄 En cours · ✅ Fait · ⏸️ En attente d'une décision
**Légende vérification** : ✅ vérifié en exécution (navigateur / requêtes) · 🔎 constaté dans le code

> ⚠️ **Dépôt public.** Les failles de sécurité non corrigées sont décrites ici sans détail d'exploitation.
> Le détail technique complet est conservé hors dépôt (`.audit-private/`, ignoré par Git).

---

## Avancement

| Phase | Statut |
|---|---|
| Audit | ✅ |
| Corrections P0 | 🔄 (2/5) |
| Corrections P1 | ⬜ |
| Corrections P2 | ⬜ |
| QA complète | ⬜ |
| Build production | ⬜ |
| Smoke test | ⬜ |
| Validation finale | ⬜ |
| Merge vers `main` | ⬜ |
| Déploiement production | ⬜ |

---

## 1. État général

Next.js 15.5 · Prisma · Supabase · Vercel. Projet avancé : marketplace multi-vendeurs, back-office admin, espace vendeur, messagerie client ↔ vendeur, PWA + notifications push, assistant boutique (règles, sans IA externe), paiement à la livraison + Fedapay + KkiaPay.

Fondations saines (prix recalculés côté serveur, stock atomique, paiements revérifiés auprès du prestataire), mais **pas déployable en l'état** : 5 bloquants, dont 2 failles de sécurité confirmées.

## 2. Ce qui fonctionne

- Toutes les routes publiques répondent, 404 propre ✅
- Catalogue : catégories, recherche (insensible à la casse), filtres et tris réellement côté serveur ; état vide propre ✅
- Panier : persistance, zone de livraison, barre « livraison gratuite », totaux exacts ✅
- Commande « paiement à la livraison » de bout en bout, données correctes en base ✅
- Paiements : prix recalculé serveur, décrément de stock sans survente, montant revérifié chez Fedapay/KkiaPay, référence de transaction unique 🔎
- Espace vendeur (7 pages), mots de passe scrypt, reset à jeton unique ✅
- Back-office admin (6 pages) ✅
- Responsive : aucun débordement horizontal à 320 / 360 / 768 / 1280 px sur 11 pages ✅
- TypeScript : 0 erreur · ESLint : 2 avertissements

## 3. Ce qui ne fonctionne pas

- Numéros béninois à 10 chiffres (format 01…) refusés au checkout ✅
- Commande Mobile Money non payée affichée « Commande confirmée ! » ✅
- « Mot de passe oublié » vendeur : le lien n'arrive jamais au vendeur en production 🔎
- Sans base de données : boutique vide (`DEMO_PRODUCTS` vide) ✅
- L'admin ne voit que la boutique maison, pas les commandes des vendeurs partenaires ✅

## 4. Fonctionnalités incomplètes

- Remboursements : logique serveur uniquement, aucune interface 🔎
- Suivi UTM des liens pub : ne mesure rien (`@vercel/analytics` absent) 🔎
- KYC vendeur invisible pour l'admin (IFU, RCCM, Mobile Money) 🔎
- Produits admin : pas de suppression ni d'upload (URL uniquement) 🔎
- Commandes Mobile Money abandonnées jamais annulées → stock bloqué ✅
- Pas de variantes produit (taille / couleur)
- Connexion client SMS / Google / Facebook : **impossible à confirmer** sans clés Supabase réelles
- Paiement réel Fedapay / KkiaPay : **impossible à confirmer** sans clés sandbox

## 5. Problèmes responsive

Aucun débordement mesuré. Problème réel : sur mobile, le bandeau cookies et la bulle de l'assistant recouvrent la barre d'achat (fiche produit) et les modes de paiement (checkout) ✅.

## 6. État du build / Git (au moment de l'audit)

- `npm install` OK · `tsc` 0 erreur · ESLint 2 warnings · `npm run build` OK (44 pages, First Load JS 105–173 kB) après un échec aléatoire `PageNotFoundError /_document` au 1er essai (Node 26 en local)
- `npm audit` (prod) : 15 vulnérabilités dont 1 critique (`next`) et 9 élevées
- Branche de travail : `audit-production` — `main` intacte

---

## 7. P0 — Bloquants

| ID | Statut | Problème | Où | Correction recommandée |
|---|---|---|---|---|
| P0-1 | ✅ | **Faille d'authentification admin** : une session non-admin pouvait être acceptée comme session admin | `src/lib/session-secrets.ts` (nouveau), `admin-auth.ts`, `vendor-auth.ts`, `vendor-auth-edge.ts`, `phone-session.ts`, `order-confirm.ts` | **Corrigé** : type de jeton dans le payload ET dans le message signé ; en production, secret dédié par type (≥ 16 car., distinct, pas d'exemple, pas `ADMIN_PASSWORD`). Testé : 29 tests unitaires + attaque rejouée en local → refusée (307 vers login). ⚠️ Voir « Checklist avant déploiement ». |
| P0-2 | ✅ | **Données privées du vendeur envoyées au navigateur** (fiche produit publique, et aussi liste vendeurs admin + formulaire profil vendeur) | `src/lib/prisma.ts`, `src/lib/catalog.ts`, `src/lib/constants.ts` (`SafeVendor`), `admin-vendors.tsx`, `vendor-profile-form.tsx`, `api/vendor/login`, `api/vendor/forgot-password`, `actions.ts` | **Corrigé** : `passwordHash` / `resetTokenHash` / `resetTokenExpires` exclus par défaut de toutes les lectures Prisma (`omit` global), demandés explicitement seulement par login et mot de passe oublié ; fiche produit limitée aux champs vendeur publics ; action morte `getProductById` supprimée. Vérifié : 0 hash dans le HTML (fiche, vitrine, admin, profil), login vendeur OK / mauvais mot de passe refusé, mot de passe oublié OK. |
| P0-3 | ⬜ | Numéros à 10 chiffres refusés (« Numéro invalide ») ✅ | `checkout-schema.ts`, `checkout-form.tsx`, `payment.ts`, `phone-session.ts` | Une seule fonction de normalisation (+229 + 8 ou 10 chiffres) partagée client / serveur / Fedapay |
| P0-4 | ⬜ | Notifications push « nouvelle commande / nouveau vendeur » envoyées à **tous** les abonnés, clients compris, avec le nom de l'acheteur 🔎 | `src/lib/order-notify.ts`, `src/app/api/vendor/register/route.ts` | Ajouter rôle + vendorId aux abonnements push et cibler les envois |
| P0-5 | ⬜ | **Injection de script possible** via le contenu produit dans le JSON-LD 🔎 | `src/components/seo/json-ld.tsx` | Échapper le JSON sérialisé, valider les produits (zod), ajouter une CSP |

## 8. P1 — Critiques

| ID | Statut | Problème | Où | Correction recommandée |
|---|---|---|---|---|
| P1-1 | ⬜ | Confirmation « Commande confirmée ! » même si le paiement Mobile Money n'a pas eu lieu ✅ | `commande/confirmation/page.tsx`, `payment.ts`, `kkiapay-checkout.tsx` | Afficher le vrai statut + bouton « Réessayer le paiement » ; `paymentUrl` absent = échec |
| P1-2 | ⬜ | Stock bloqué indéfiniment par les commandes non payées ; création de commandes sans limite de débit ✅ | `src/lib/actions.ts` (`createOrder`) | Rate limit IP + téléphone ; cron d'annulation des commandes non payées avec restitution du stock |
| P1-3 | ⬜ | Le vendeur peut fixer n'importe quel statut de commande (impayée → livrée → reversement) 🔎 | `src/lib/vendor-actions.ts` (`updateMyOrderStatus`) | Machine à états + statut de paiement séparé ; interdire de quitter `annulee` |
| P1-4 | ⬜ | Reversements : montant affiché ≠ montant enregistré ; double reversement possible 🔎 | `src/lib/actions.ts` (`listAdminPayoutData`, `createVendorPayout`) | Filtre partagé (livrée / payée) ; `payoutId: null` vérifié dans la transaction |
| P1-5 | ⬜ | Aucun `error.tsx` / `global-error.tsx` / `loading.tsx` ; erreur checkout = écran brut ✅ | `src/app` | Ajouter les boundaries + try/catch dans `createOrder` et le formulaire |
| P1-6 | ⬜ | Identifiants vendeurs présents dans l'historique Git d'un dépôt public 🔎 | historique Git | Changer les mots de passe concernés ; purger l'historique si nécessaire |
| P1-7 | ⬜ | Rate limiting en mémoire → inefficace sur Vercel (login admin, OTP, login vendeur, chat) 🔎 | `src/lib/rate-limit.ts` | `rateLimitAsync` (base) partout, upsert atomique |
| P1-8 | ⬜ | « Acheter maintenant » peut commander le panier d'un autre vendeur ; pas de choix de zone au checkout (Cotonou forcé) ✅ | `product-purchase-bar.tsx`, `cart-store.ts`, `checkout-form.tsx` | `addItem` renvoie un booléen ; jamais de repli sur tout le panier ; `ZoneSelector` au checkout |
| P1-9 | ⬜ | Prix / stock du panier jamais revalidés → montant affiché ≠ facturé possible 🔎 | `src/lib/cart-store.ts` | Action `validateCart` au panier et au checkout |
| P1-10 | ⬜ | Quantité > 20 et erreurs Zod affichées en anglais 🔎 | `checkout-schema.ts`, `cart-store.ts` | Plafond `min(stock, 20)` côté client ; messages FR |
| P1-11 | ⬜ | Panier vidé avant le paiement Mobile Money, pas de bouton « Réessayer » (KkiaPay) 🔎 | `checkout-form.tsx`, `kkiapay-checkout.tsx` | Vider après confirmation ; bouton de relance du widget |
| P1-12 | ⬜ | Cookie d'accès commande : 1 h, une seule commande ; secret partagé avec l'admin 🔎 | `src/lib/order-confirm.ts` | Secret dédié, plusieurs commandes, 24 h |
| P1-13 | ⬜ | Annulation admin sans restitution du stock ni statut de remboursement 🔎 | `src/lib/actions.ts` (`updateOrderStatus`) | Même logique que l'annulation vendeur, en transaction |
| P1-14 | ⬜ | Admin limité à la boutique maison ; KYC vendeur invisible ✅ | `actions.ts` (`getDefaultVendor`), `admin-vendors.tsx` | Vue marketplace globale + affichage KYC |
| P1-15 | ⬜ | « Mot de passe oublié » vendeur non fonctionnel en production 🔎 | `api/vendor/forgot-password`, `api/ops/notify` | Envoi du lien au vendeur (email / WhatsApp) |
| P1-16 | ⬜ | Messagerie tronquée au-delà de 200 messages 🔎 | `src/lib/messaging.ts` | `orderBy desc` + `take`, puis inverser |

## 9. P2 — Importants

| ID | Statut | Problème | Où |
|---|---|---|---|
| P2-1 | ⬜ | Vulnérabilités npm (1 critique, 9 élevées) — mettre à jour `next`, `@supabase/*`, `sharp`… | `package.json` |
| P2-2 | ⬜ | Page d'accueil sans `<title>` (local et production) ✅ | `src/app/page.tsx` / `src/lib/seo.ts` |
| P2-3 | ⬜ | Pas de Content-Security-Policy ✅ | `next.config.ts` |
| P2-4 | ⬜ | Pages `/admin` et `/vendeur/espace` mises en cache hors ligne par le service worker 🔎 | `next.config.ts` (`runtimeCaching`) |
| P2-5 | ⬜ | Actions produit sans validation serveur (prix négatif/décimal → 500, URL d'image libre qui casse `next/image`) 🔎 | `vendor-actions.ts`, `actions.ts` (`upsertProduct`) |
| P2-6 | ⬜ | Webhooks paiement : format de signature Fedapay à valider, paiements échoués non traités, mode de paiement non contrôlé 🔎 | `src/lib/payment-confirm.ts`, `api/payments/*` |
| P2-7 | ⬜ | Sessions non révocables ; reset mot de passe n'invalide pas les sessions 🔎 | `admin-auth.ts`, `vendor-auth.ts` |
| P2-8 | ⬜ | Frais de livraison dupliqués serveur / `NEXT_PUBLIC_*` → écart possible affiché / facturé 🔎 | `src/lib/shipping.ts` |
| P2-9 | ⬜ | Annulation non transactionnelle ; produit archivé réactivé à tort 🔎 | `actions.ts`, `vendor-actions.ts` |
| P2-10 | ⬜ | Favoris affichent produits archivés / vendeurs suspendus 🔎 | `catalog.ts` (`fetchProductsByIds`) |
| P2-11 | ⬜ | Client Google/Facebook ne voit pas ses commandes ; `?next=` ignoré après connexion 🔎 | `actions.ts`, `order-access.ts`, `compte` |
| P2-12 | ⬜ | Finances vendeur calculées sur 50 commandes max, impayées incluses 🔎 | `vendor-actions.ts` (`getMyVendorFinances`) |
| P2-13 | ⬜ | Inscription vendeur : slugs réservés non vérifiés (« espace », « login »…) 🔎 | `api/vendor/register` |
| P2-14 | ⬜ | Bandeau cookies + bulle assistant masquent les CTA sur mobile ; « Hello — je t'aide » en anglais ✅ | `cookie-banner.tsx`, `shop-chatbot.tsx` |
| P2-15 | ⬜ | Placeholder téléphone ancien format « 97 00 00 00 » ; « 21000 FCFA » non formaté ✅ | `checkout-form.tsx`, fiche produit |
| P2-16 | ⬜ | Upload : repli `public/uploads` impossible sur Vercel ; type de fichier non vérifié par contenu 🔎 | `api/vendor/upload` |
| P2-17 | ⏸️ | Contenu à valider : produits nommés Rolex / AP / Patek (authenticité impossible à confirmer → risque juridique), RCCM / IFU « en cours », contacts d'exemple | catalogue, variables d'env |

## 10. P3 — Améliorations

| ID | Statut | Amélioration |
|---|---|---|
| P3-1 | ⬜ | Bouton Déconnexion visible sur mobile (admin / vendeur) |
| P3-2 | ⬜ | Remplacer `alert()` / `confirm()` par des modales ; confirmation avant suspension vendeur |
| P3-3 | ⬜ | Libellés FR des statuts côté vendeur (au lieu de `en_attente`, `confirmee`) |
| P3-4 | ⬜ | « Quatre chemins » alors que 5 catégories ; catégories Sacs / Lunettes vides |
| P3-5 | ⬜ | Indicateur de chargement sur les filtres boutique |
| P3-6 | ⬜ | Galerie produit : flèches + zoom desktop |
| P3-7 | ⬜ | Pagination du catalogue ; `React.cache` sur `fetchProductById` (requête doublée) |
| P3-8 | ⬜ | Index Prisma (orders, conversations, products) ; `refundStatus` en enum |
| P3-9 | 🔄 | Supprimer code mort (`getProducts`, ~~`getProductById`~~ supprimé en P0-2, `getSimilarProducts`, `listPayoutQueue`, `benefit-chips.tsx`…) et doublons (niches, UTM, lien WhatsApp) |
| P3-10 | ⬜ | Migrer `next lint` → ESLint CLI ; corriger les 2 warnings |
| P3-11 | ⬜ | Assistant boutique : salutation prioritaire sur la recherche, regex « ok », « autre suggestion », niches inexistantes |
| P3-12 | ⬜ | Messagerie : doublons du message auto « Contacter », notification au vendeur |
| P3-13 | ⬜ | Énumération des comptes vendeurs (inscription 409, timing login) ; secret `ops/notify` en query string |

---

## 11. Parcours d'achat testé (05/10/2026)

| Étape | Résultat |
|---|---|
| Accueil → catégories → recherche → fiche produit | ✅ |
| Ajout panier, persistance, zone, totaux | ✅ |
| Checkout avec numéro 10 chiffres | ❌ « Numéro invalide » (P0-3) |
| Checkout paiement à la livraison (8 chiffres) | ✅ commande créée, données correctes |
| « Acheter » direct sur mobile | ⚠️ zone forcée Cotonou (P1-8) |
| Mobile Money (mock) | ❌ commande en attente affichée « confirmée » (P1-1) |
| Paiement réel Fedapay / KkiaPay | Impossible à confirmer sans clés sandbox |
| Connexion client SMS / Google / Facebook | Impossible à confirmer sans clés Supabase |

## 12. Décisions en attente

- ⏸️ **Paiement à la livraison** : qui encaisse — la plateforme ou le vendeur ? (impacte les reversements, P1-3 / P1-4)
- ⏸️ **Clés de test** : Fedapay / KkiaPay sandbox + projet Supabase de test pour valider paiement et connexion.

## 13. Plan de correction

1. **P0 sécurité** : P0-1, P0-2, P0-5, P0-4
2. **P0 checkout** : P0-3
3. **P1 tunnel d'achat** : P1-1, P1-8, P1-9, P1-10, P1-11, P1-5, P1-2, P1-12
4. **P1 marketplace** : P1-3, P1-4, P1-13, P1-14, P1-15, P1-16, P1-7, P1-6
5. **P2** puis **P3**
6. QA complète → build production → smoke test → validation → merge `main` → déploiement

## Checklist avant déploiement (à compléter au fil des corrections)

- [ ] **Vercel → variables d'environnement** : définir `ADMIN_SESSION_SECRET`, `VENDOR_SESSION_SECRET` et `PHONE_SESSION_SECRET` avec **3 valeurs différentes** (≥ 16 car., générées avec `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). Sans cela, après P0-1 : admin, espace vendeur, connexion SMS **et page de confirmation de commande** sont désactivés en production. (P0-1)
- [ ] Prévenir admin / vendeurs / clients connectés : toutes les sessions existantes seront déconnectées une fois au déploiement (nouveau format de jeton). (P0-1)

## Journal des corrections

| Date | ID | Commit | Note |
|---|---|---|---|
| 05/10/2026 | — | `03f3b72` | Audit initial |
| 06/10/2026 | P0-1 | `e8d97a8` | Jetons de session typés + secrets dédiés par type en production |
| 06/10/2026 | P0-2 | voir `git log` | Champs secrets vendeur exclus par défaut (Prisma `omit`), fiche produit limitée aux champs publics |
