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
| Corrections P0 | ✅ (5/5) |
| Corrections P1 | 🔄 (5/16) |
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
| P0-3 | ✅ | Numéros à 10 chiffres refusés (« Numéro invalide ») | `src/lib/bj-phone.ts` (nouveau), `checkout-schema.ts`, `checkout-form.tsx`, `phone-auth-form.tsx`, `payment.ts`, `phone-session.ts`, `order-access.ts`, `commande/paiement`, migration `20261006_bj_phone_10_digits` | **Corrigé** : fonction unique partagée client / serveur / Fedapay / KkiaPay. Accepte `01XXXXXXXX`, `+229…`, `00229…`, avec ou sans espaces ; ancien numéro 8 chiffres converti en `01` + ancien (règle officielle). Format stocké : `+22901XXXXXXXX`. Migration SQL qui convertit les clients et commandes existants (sans doublon). Placeholder et message d'erreur mis à jour. Vérifié : 18 tests unitaires + commande réelle avec `01 97 00 00 07` → confirmée. Fedapay reçoit désormais 10 chiffres (à valider en sandbox, voir P2-6). |
| P0-4 | ✅ | Notifications push « nouvelle commande / nouveau vendeur » envoyées à **tous** les abonnés, clients compris, avec le nom de l'acheteur | `prisma/schema.prisma` + migration `20261006_push_roles`, `src/lib/push-audience.ts` (nouveau), `order-notify.ts`, `api/push/subscribe`, `api/admin/push`, `api/vendor/register`, `push-opt-in-card.tsx`, `admin/notifications`, `vendeur/espace` | **Corrigé** : chaque abonnement a un rôle (`client` / `admin` / `vendor` + vendorId), un appareil peut en avoir plusieurs. Nouvelle commande → admin + vendeur concerné ; nouveau vendeur → admin ; annonce marketing → clients. Abonnement admin / vendeur vérifié par la session. Carte « Alertes » ajoutée dans l'espace admin et vendeur (thème sombre). Vérifié : 8 tests d'accès (401 sans session admin / vendeur) + 5 tests de ciblage. Réception réelle sur téléphone : impossible à confirmer en local (navigateur de test bloque les notifications). |
| P0-5 | ✅ | **Injection de script possible** via le contenu produit dans le JSON-LD (reproduite en local : script exécuté) | `src/components/seo/json-ld.tsx` | **Corrigé** : nouveau `serializeJsonLd` qui échappe `<` `>` `&` U+2028 U+2029 (seul point d'injection HTML brut du code). Vérifié : 6 tests unitaires + produit piégé en local → script **non** exécuté, nom affiché en texte, JSON-LD valide ; fiche normale inchangée. Défense en profondeur restante : validation zod des produits (P2-5) et CSP (P2-3). |

## 8. P1 — Critiques

| ID | Statut | Problème | Où | Correction recommandée |
|---|---|---|---|---|
| P1-1 | ✅ | Confirmation « Commande confirmée ! » même si le paiement Mobile Money n'a pas eu lieu | `src/lib/order-confirmation-state.ts` (nouveau), `commande/confirmation/page.tsx`, `payment.ts`, `actions.ts` | **Corrigé** : la page affiche l'état réel — « Paiement en attente » (+ « Finaliser le paiement » si relance possible, « J'ai payé — actualiser »), « Paiement reçu », « Commande reçue » (livraison), « Commande annulée ». Logique indépendante du prestataire (prête pour FeexPay). Fedapay sans lien de paiement = échec (commande annulée, stock rendu). Commandes `demo_…` refusées en production. Vérifié : 11 tests + commande Mobile Money réelle en local (en attente → payée → annulée). |
| P1-2 | ⬜ | Stock bloqué indéfiniment par les commandes non payées ; création de commandes sans limite de débit ✅ | `src/lib/actions.ts` (`createOrder`) | Rate limit IP + téléphone ; cron d'annulation des commandes non payées avec restitution du stock |
| P1-3 | ⬜ | Le vendeur peut fixer n'importe quel statut de commande (impayée → livrée → reversement) 🔎 | `src/lib/vendor-actions.ts` (`updateMyOrderStatus`) | Machine à états + statut de paiement séparé ; interdire de quitter `annulee` |
| P1-4 | ⬜ | Reversements : montant affiché ≠ montant enregistré ; double reversement possible 🔎 | `src/lib/actions.ts` (`listAdminPayoutData`, `createVendorPayout`) | Filtre partagé (livrée / payée) ; `payoutId: null` vérifié dans la transaction |
| P1-5 | ⬜ | Aucun `error.tsx` / `global-error.tsx` / `loading.tsx` ; erreur checkout = écran brut ✅ | `src/app` | Ajouter les boundaries + try/catch dans `createOrder` et le formulaire |
| P1-6 | ⬜ | Identifiants vendeurs présents dans l'historique Git d'un dépôt public 🔎 | historique Git | Changer les mots de passe concernés ; purger l'historique si nécessaire |
| P1-7 | ⬜ | Rate limiting en mémoire → inefficace sur Vercel (login admin, OTP, login vendeur, chat) 🔎 | `src/lib/rate-limit.ts` | `rateLimitAsync` (base) partout, upsert atomique |
| P1-8 | ✅ | « Acheter maintenant » pouvait commander le panier d'un autre vendeur ; pas de choix de zone au checkout (Cotonou forcé) | `cart-store.ts`, `product-purchase-bar.tsx`, `add-to-cart-button.tsx`, `checkout-form.tsx` | **Corrigé** : `addItem` / nouveau `buyNow` renvoient un résultat (`added` / `other_vendor` / `out_of_stock`) ; « Acheter maintenant » ne navigue que si l'ajout a réussi (sinon message + lien panier), fixe la quantité exacte (plus de cumul) ; « Ajouté » seulement si ajouté, plus de ligne à quantité 0 ; checkout sans repli sur tout le panier (état vide avec liens) ; sélecteur de zone au checkout. Vérifié en navigateur : autre boutique → reste sur la page + message ; 2 clics → quantité 1 ; zone Porto-Novo → total 20 500 et commande enregistrée `porto_novo` / 1 500 FCFA. |
| P1-9 | ✅ | Prix / stock du panier jamais revalidés → montant affiché ≠ facturé possible | `actions.ts` (`getCartSnapshot`, `createOrder`), `checkout-schema.ts`, `cart-store.ts` (`applySnapshot`), `use-cart-sync.ts` (nouveau), `cart-changes-notice.tsx` (nouveau), `cart-view.tsx`, `checkout-form.tsx` | **Corrigé** : à l'ouverture du panier et du checkout, prix / stock / disponibilité revalidés auprès du serveur ; prix mis à jour, quantité plafonnée au stock, article indisponible retiré, avec un message par changement. Filet de sécurité : le checkout envoie le total affiché, la commande est refusée s'il diffère du total serveur (nouveau total affiché, panier resynchronisé). Vérifié en navigateur : baisse de prix / stock réduit / produit archivé détectés ; prix modifié pendant le checkout → commande refusée (aucune commande créée), bouton passe au nouveau total. |
| P1-10 | ✅ | Quantité > 20 possible côté client puis refusée par le serveur avec un message Zod en anglais | `constants.ts` (`MAX_QTY_PER_ITEM`, `maxOrderQty`), `cart-store.ts`, `product-purchase-bar.tsx`, `cart-view.tsx`, `checkout-schema.ts` | **Corrigé** : plafond unique `min(stock, 20)` partagé client / serveur (fiche produit, panier, achat immédiat, revalidation) ; tous les messages du schéma de commande en français (nom, téléphone, adresse, zone, paiement, quantité, panier vide, nombre d'articles). Vérifié : 13 tests de messages + test navigateur Edge (profil vierge) : sélecteur bloqué à 20 sur la fiche et au panier, erreur d'adresse en français au checkout. |
| P1-11 | ✅ | Panier vidé avant le paiement Mobile Money sans bouton « Réessayer » (KkiaPay) ; « Aucun article à commander » affiché un instant avant la confirmation | `checkout-form.tsx`, `kkiapay-checkout.tsx`, `commande/paiement/page.tsx` | **Corrigé** : vider le panier après création de la commande reste voulu (stock réservé, évite la double commande), mais l'écran affiche « Commande enregistrée — redirection… » au lieu du panier vide. KkiaPay : bouton « Payer maintenant / Réessayer le paiement » qui rouvre le widget, écouteurs inscrits une seule fois (ils s'accumulaient), « Voir ma commande » (statut + options) au lieu de « Retour au panier » (vide), message d'échec sans « choisis le COD » (impossible sur une commande existante), message clair si la clé KkiaPay manque. Vérifié : test Edge avec faux widget KkiaPay (aucun appel externe) — 11 contrôles OK. À prévoir avec FeexPay : changer de mode de paiement sur une commande en attente. |
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
| P2-15 | 🔄 | ~~Placeholder téléphone ancien format~~ (corrigé en P0-3) ; « 21000 FCFA » non formaté ✅ | fiche produit |
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
| P3-14 | ⬜ | En dev (PWA désactivée), la carte notifications reste bloquée sur « Notifications… » (`serviceWorker.ready` ne se résout jamais) — sans impact en production |
| P3-15 | ✅ | En dev, le navigateur gardait d'anciens fichiers JS (en-tête `immutable` d'un an appliqué aussi en dev, noms de fichiers inchangés) → modifications invisibles. Corrigé : en-tête limité à la production (`next.config.ts`). À revérifier au prochain build production. |

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

- ⏸️ **FeexPay** : intégration prévue à la place de Fedapay / KkiaPay (à détailler plus tard). La page de confirmation (P1-1) est déjà indépendante du prestataire ; à prévoir : création de transaction, webhook signé, vérification du montant, test sandbox.

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
- [ ] Migration `20261006_bj_phone_10_digits` : appliquée automatiquement au build Vercel (`prisma migrate deploy`). Faire une **sauvegarde de la base** avant le déploiement (elle réécrit les numéros des clients et commandes). (P0-3)
- [ ] Tester un paiement Fedapay sandbox avec un numéro 10 chiffres. (P0-3 / P2-6)
- [ ] Migration `20261006_push_roles` : les abonnements push existants deviennent « client ». **Après déploiement, l'admin et chaque vendeur doivent réactiver leurs alertes** (Admin → Notifications, Espace vendeur → Tableau de bord). Tester la réception sur un vrai téléphone. (P0-4)

## Journal des corrections

| Date | ID | Commit | Note |
|---|---|---|---|
| 05/10/2026 | — | `03f3b72` | Audit initial |
| 06/10/2026 | P0-1 | `e8d97a8` | Jetons de session typés + secrets dédiés par type en production |
| 06/10/2026 | P0-2 | `d50b605` | Champs secrets vendeur exclus par défaut (Prisma `omit`), fiche produit limitée aux champs publics |
| 06/10/2026 | P0-3 | `e0857a1` | Numéros béninois 10 chiffres : fonction unique + migration des données existantes |
| 06/10/2026 | P0-5 | `1f44253` | JSON-LD échappé : plus d'injection de script via les noms / descriptions produits |
| 06/10/2026 | P0-4 | `7536f9d` | Notifications push ciblées par rôle (client / admin / vendeur) — **tous les P0 sont corrigés**, build production OK |
| 06/10/2026 | P1-1 | `baf83ea` | Page de confirmation selon l'état réel de la commande et du paiement |
| 06/10/2026 | P1-8 | `40deec0` | Achat immédiat fiable (autre boutique, quantité exacte) + choix de zone au checkout |
| 06/10/2026 | P3-15 | `4b3d5dc` | Cache `immutable` de `/_next/static` limité à la production (servait du vieux code en dev) |
| 07/10/2026 | P1-9 | `70ba11e` | Panier revalidé (prix, stock, disponibilité) + total vérifié côté serveur avant commande |
| 07/10/2026 | P1-10 | `beb5fb6` | Quantité plafonnée à 20 partout + messages de commande en français |
| 07/10/2026 | P1-11 | voir `git log` | Plus de panier vide affiché après commande ; KkiaPay réessayable, sans impasse |
