# Design System Coin229 — audit et plan d'harmonisation

> Branche : `design-system` (créée depuis `audit-production`, `main` non modifié).
> Référence de marque : **le site public**. Les espaces client, vendeur et admin en sont des déclinaisons fonctionnelles.
> Légende : ⬜ à faire · 🔄 en cours · ✅ fait

---

## Avancement

| Étape | Statut |
|---|---|
| 1. Audit du design system actuel | ✅ |
| 2. Incohérences public / espaces internes | ✅ |
| 3. Tokens globaux | ✅ |
| 4. Composants partagés | ⬜ |
| 5. Migration des pages | ⬜ |
| 6. Vérification par espace | ⬜ |
| 7. Responsive | ⬜ |
| 8. Non-régression fonctionnelle | ⬜ |

---

## 1. Ce que le site public utilise aujourd'hui (la référence)

Tout est déclaré dans `src/app/globals.css` (Tailwind 4, bloc `@theme`).

| Élément | Valeur actuelle | Remarque |
|---|---|---|
| Couleur principale | `#0F2D26` Deep Green — **nommée `navy`** dans le code (`bg-navy`, `text-navy`) | Le nom « navy » est un reste de l'ancienne identité |
| Survol principal | `#163A32` (`navy-soft`) | |
| Accent | `#D4AF37` Gold (`amber`), survol `#B8942A` (`amber-dark`) | Le nom `amber` entre en conflit avec la palette Tailwind (`amber-300`, `amber-500` = orange) |
| Fonds | `#FFFFFF` (`bg`, `card`), `#F6F3EC` Cream (`cream`, `surface`, `bg-elevated` — 3 noms pour la même valeur) | |
| Texte | `#111111` (`fg`), `#6B7280` (`muted`) | |
| Bordure | `#E5E7EB` | |
| Statuts | `green #1F7A5C`, `coral #C45C5C`, `violet #5B6CFF`, `rose` (= coral) | Pas de système warning / info |
| Polices | Poppins (`font-display` : titres h1-h4, `.btn`) · Inter (`font-sans` : texte) | Bien en place via `next/font` |
| Radius | `--radius-control 10px`, `--radius-card 12px`, `--radius-pill` | Tokens déclarés mais **jamais utilisés** : le code écrit `rounded-[10px]` (35×) et `rounded-[12px]` (20×) |
| Ombre | `--shadow-soft` (`.shadow-card`) | |
| Focus | contour 2px Gold, décalé de 2px | Global, correct |
| Boutons | `.btn` + `.btn-primary` (Deep Green), `.btn-secondary` (blanc bordé), `.btn-accent` (Gold), `.btn-ghost` | Pas de variante destructive, pas de tailles |
| Badges | `.badge-new` (Deep Green), `.badge-sale` (Gold), `.badge-soldout` | Statuts de commande définis à part (`ORDER_STATUS_COLORS`) |
| Icônes | `lucide-react` partout (54 imports), 1 SVG maison (logos Google/Facebook) | ✅ une seule famille ; tailles et épaisseurs variables (`stroke-[1.5]`, `stroke-[2]`, défaut) |

**Conclusion** : l'identité est bien définie (Deep Green × Gold × Cream, Poppins × Inter), mais elle n'existe qu'à moitié sous forme de tokens, et aucun composant n'est partagé : chaque écran réécrit ses classes.

---

## 2. Incohérences constatées

Mesures faites sur `src/` le 08/10/2026, captures dans `.audit-private/ds/avant/`.

### 2.1 Deux autres applications à l'intérieur de Coin229

| Espace | Ce qu'on voit | Fichiers |
|---|---|---|
| **Admin** (back-office + connexion) | Fond quasi noir `#0A0B0F`, sidebar `#111318`, cartes `#161920`, accent **vert émeraude** Tailwind (`emerald-300/400/500`) | `admin-shell.tsx` + 7 composants admin + 3 pages |
| **Vendeur** (espace + connexion, inscription, mot de passe) | Fond quasi noir `#0C0D12`, cartes `#1A1C24`, accent **orange** Tailwind (`amber-400/500` = `#F59E0B`, pas le Gold de marque) | `vendor-shell.tsx` + 9 composants vendeur + 4 pages |
| Composants partagés touchés | Carte notifications, fil de messages, fenêtre de confirmation : une version « sombre » maintenue en parallèle | `push-opt-in-card`, `chat-thread`, `confirm-dialog` |

- **29 fichiers** sur fond sombre, **310 classes** `text-/bg-/border-white/xx` propres à ce thème sombre.
- **101 couleurs hexadécimales** écrites en dur dans les classes (`[#0c0d12]` ×36, `[#1a1c24]` ×16, `[#0a0b0f]` ×14…).
- Palette Tailwind hors marque : `amber-*` ×78 (orange), `emerald-*` ×38, `red-*` ×26, plus `sky`, `violet`.
- Résultat : en passant du site à l'espace vendeur, on change de fond (crème → noir), de couleur principale (vert profond → orange) et de style de champ. Ça ressemble à une autre application.

### 2.2 Incohérences à l'intérieur du site public

- **Connexion client** (`/compte`) : bouton principal en **Gold** (au lieu du Deep Green), champs et boutons en pilule (`rounded-full`, 11×) alors que le reste du site utilise 10px, dégradé **orange / rose** en haut de page (hors charte).
- **Gold utilisé comme couleur de texte sur fond clair** dans ~30 fichiers (liens « Contacter… », « En savoir plus », compte, chatbot…). Contraste Gold / blanc ≈ **2,1:1** (minimum WCAG 4,5:1) : illisible pour une partie des gens. Sur Deep Green (bandeau, hero, pied de page) le Gold passe bien (≈ 6,6:1).
- **Statuts de commande** : « En attente » en Gold, « Confirmée » en violet, « En livraison » en corail (couleur d'erreur), alors qu'un statut ne doit pas emprunter la couleur de marque.
- Gris `#6B7280` sur fond Cream ≈ 4,4:1 : juste sous le seuil pour du petit texte.

### 2.3 Composants dupliqués

| Composant | Situation |
|---|---|
| Champs de formulaire | **≥ 12 styles différents** (hauteurs `py-2` / `py-2.5` / `py-3`, radius `lg` / `xl` / `[10px]` / `full`, focus Deep Green, Gold, émeraude ou orange). 4 fichiers déclarent leur propre constante `field` |
| Boutons | 100 `<button>`, dont ~40 seulement utilisent `.btn` ; le reste est écrit à la main (émeraude, orange, rouge…) ; pas de bouton destructif commun |
| Cartes | `rounded-xl` (47), `rounded-2xl` (26), `rounded-[12px]` (20), `rounded-[20px]`, avec ou sans ombre selon l'écran |
| Fenêtres / tiroirs | Fenêtre de confirmation (2 thèmes), zoom galerie, tiroir filtres (`bg-navy/40`), panneau chatbot, menu mobile : fonds, radius et animations différents |
| Statuts | `ORDER_STATUS_COLORS` (public), `statusTone` (admin, émeraude/sky/violet), libellés vendeur à part |
| Tableaux | Aucun tableau partagé : listes en cartes, chacune avec sa mise en forme |
| Chargement / vide / erreur | Squelettes publics clairs (`page-skeleton.tsx`), aucun état vide commun, spinners `Loader2` de couleurs variées |

### 2.4 Ce qui est déjà bien et sera conservé

- Une seule famille d'icônes (Lucide).
- Polices bien chargées, un seul jeu (Poppins + Inter), y compris en admin.
- Focus visible global.
- Mise en page mobile de l'admin et du vendeur (en-tête + onglets défilants, corrigée en P3-1) et sidebar ordinateur : la **structure** est bonne, seul le **langage visuel** est à unifier.

---

## 3. Tokens cibles (à valider)

Noms **sémantiques** : un composant demande `primary`, `surface`, `text-secondary`… jamais une couleur brute. Le nom `navy` disparaît (alias temporaire le temps de la migration, puis supprimé). `amber` est renommé `accent` pour ne plus se mélanger à l'orange de Tailwind.

### Couleurs de marque

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#0F2D26` Deep Green | Actions principales, sidebar, liens forts, titres de marque |
| `primary-hover` | `#163A32` | Survol |
| `primary-active` | `#0A211B` | Appui |
| `primary-soft` | `#E7EEEC` | Fonds légers (élément actif de navigation sur fond clair, puces) |
| `accent` | `#D4AF37` Gold | Accent de marque : soulignés, filets, prix promo, CTA sur fond Deep Green — **jamais en texte sur fond clair** |
| `accent-hover` | `#B8942A` | Survol |
| `accent-soft` | `#F7EFD4` | Fond léger doré (badge « promo », mise en avant) |
| `accent-ink` | `#7A5F14` | Le doré lisible pour du **texte** sur fond clair (contraste ≈ 6:1 sur blanc, 5,5:1 sur crème) |

### Surfaces (hiérarchie claire)

| Token | Valeur | Usage |
|---|---|---|
| `background` | `#F6F3EC` Cream | Fond des pages internes (admin, vendeur, compte) et des sections alternées du site |
| `surface` | `#FFFFFF` | Cartes, panneaux, champs, fenêtres |
| `surface-muted` | `#FAF8F3` | En-têtes de tableau, zones secondaires dans une carte |
| `surface-inverse` | `#0F2D26` | Seule surface sombre autorisée : sidebar, bandeau, hero, pied de page (le Deep Green, pas du noir) |
| `overlay` | `rgba(15,45,38,0.55)` | Fond derrière fenêtres et tiroirs |

Le site public garde son fond blanc principal ; les espaces internes passent sur Cream avec cartes blanches (plus dense, mais même matière).

### Texte, bordures, états

| Token | Valeur | Usage |
|---|---|---|
| `text-primary` | `#111111` | Texte principal |
| `text-secondary` | `#4B5563` | Texte secondaire, petit texte sur Cream |
| `text-muted` | `#6B7280` | Aide, métadonnées (sur blanc uniquement pour le petit texte) |
| `text-inverse` | `#FFFFFF` | Sur Deep Green |
| `border` | `#E5E7EB` | Bordures par défaut |
| `border-strong` | `#D1D5DB` | Champs, séparateurs appuyés |
| `success` / `success-soft` | `#1F7A5C` / `#E6F2EC` | Livré, disponible, payé |
| `warning` / `warning-soft` | `#B45309` / `#FEF3E2` | En attente, stock bas (orange brûlé : distinct du Gold) |
| `error` / `error-soft` | `#B42318` / `#FDECEA` | Erreurs, annulé, actions destructives |
| `info` / `info-soft` | `#1D5D8C` / `#E8F1F8` | Confirmé, en livraison, informations |
| `neutral` / `neutral-soft` | `#4B5563` / `#F3F4F6` | Brouillon, archivé |

### Autres tokens

| Famille | Valeurs |
|---|---|
| Typographie | Poppins (`font-display`) : titres, navigation, boutons, marque · Inter (`font-sans`) : texte, labels, tableaux, formulaires. Échelle : 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 |
| Radius | `sm 6px` (badges) · `control 10px` (champs, boutons) · `card 12px` (cartes) · `panel 16px` (fenêtres, tiroirs) · `pill` (puces de filtre) |
| Ombres | `shadow-sm` (cartes au repos) · `shadow-card` (survol, éléments flottants) · `shadow-overlay` (fenêtres) |
| Espacements | Échelle Tailwind (4px), conventions : padding carte 16/20px, écart entre champs 16px, sections 24/32px |
| Contrôles | Hauteur 44px (zone tactile), 40px en version compacte (tableaux) |
| Transitions | 150ms pour couleur/bordure, 200ms pour fenêtres/tiroirs, `ease-out` ; respect de `prefers-reduced-motion` (déjà en place) |
| Points de rupture | Ceux de Tailwind (`sm 640`, `md 768`, `lg 1024`, `xl 1280`) — inchangés |

---

## 4. Composants partagés à créer (`src/components/ui/`)

| Composant | Contenu |
|---|---|
| `Button` | Variantes `primary`, `secondary`, `outline`, `accent`, `ghost`, `destructive` ; tailles `sm` / `md` / `lg` ; état chargement (spinner + désactivé) ; version lien |
| `Field` + `Input` / `Textarea` / `Select` | Label, champ, message d'aide **ou** d'erreur (rouge + icône + `aria-describedby`), état succès, désactivé ; même hauteur, radius, focus partout |
| `Checkbox`, `Radio` | Case cochée Deep Green, label cliquable |
| `Card` | Surface blanche, bordure, radius `card`, padding standard, variante interactive (survol) |
| `Badge` / `StatusBadge` | `success`, `warning`, `error`, `info`, `neutral`, `brand`, `accent`, en version soft ou pleine ; `StatusBadge` relie chaque statut de commande / produit / vendeur à une couleur, **une seule fois pour tout le site** |
| `Modal` | Reprend `confirm-dialog` (natif `<dialog>`), un seul thème, radius `panel`, overlay Deep Green |
| `Drawer` | Même base, côté droit ou bas (filtres boutique, menu mobile des espaces) |
| `Table` | En-tête, lignes, survol, actions ; **sur mobile, chaque ligne devient une carte** (pas de débordement) |
| `Alert` | Message dans la page (info, succès, attention, erreur) |
| `Toast` | Confirmation courte (« Produit enregistré ») — n'existe pas aujourd'hui |
| `Tabs`, `Dropdown`, `Pagination` | Onglets (navigation mobile des espaces, filtres), menu d'actions, « Voir plus » / pages |
| `Skeleton`, `Spinner`, `EmptyState`, `ErrorState` | États de chargement, vide, erreur homogènes |
| `AppShell` | Une seule coquille pour admin **et** vendeur : sidebar Deep Green (actif = texte blanc + filet Gold), contenu Cream, en-tête mobile + menu ; seuls le titre de l'espace et les liens changent |

---

## 5. Ordre de migration

1. Tokens dans `globals.css` (+ alias temporaires `navy`, `amber` pour ne rien casser).
2. Composants `ui/` + page de démonstration interne (`/admin/design-system`) pour les vérifier tous au même endroit.
3. `AppShell` admin / vendeur (fond Cream, sidebar Deep Green) — le changement le plus visible.
4. Connexions et inscriptions : admin, vendeur, client.
5. Pages admin (tableau de bord, commandes, produits, vendeurs, reversements, notifications).
6. Pages vendeur (tableau de bord, produits, commandes, messages, finances, profil, liens pub).
7. Espace client (compte, commandes, messages) et tunnel d'achat (panier, commande, paiement, confirmation).
8. Site public : statuts, Gold en texte → `accent-ink`, fenêtres / tiroirs, états vides et d'erreur.
9. Suppression des alias (`navy`, `amber`, `coral`, `violet`, hex en dur) — un contrôle automatique empêchera de les réintroduire.
10. Vérifications : captures avant / après de chaque espace (ordinateur, tablette, mobile), contraste, clavier, tests fonctionnels existants (P0 → P3).

---

## Journal

| Date | Étape | Commit | Résumé |
|---|---|---|---|
| 08/10/2026 | 1-2 | voir `git log` | Audit du design system et des incohérences, tokens et composants cibles |
| 08/10/2026 | 3 | voir `git log` | Tokens sémantiques dans `globals.css` (primary, accent, accent-ink, background, surface, états…), anciens noms `navy` / `amber` / `cream` / `coral` renommés partout (423 classes), Gold en texte sur fond clair → `accent-ink` (34 endroits) |
