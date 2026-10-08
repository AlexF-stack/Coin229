"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { Filter, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIES, CATEGORIE_LABELS, nicheLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import type { Categorie, Genre } from "@prisma/client";

type Props = {
  resultCount: number;
  niches?: string[];
  /** Catégories ayant des produits (défaut : toutes) */
  categories?: Categorie[];
};

const genres: { value: Genre | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "unisexe", label: "Unisexe" },
];

const sorts = [
  { value: "pertinence", label: "Classement" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
];

export function BoutiqueToolbar({ resultCount, niches = [], categories = CATEGORIES }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Vrai tant que la nouvelle liste n'est pas arrivée du serveur
  const [loading, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const categorie = (params.get("categorie") ?? "") as Categorie | "";
  const niche = params.get("niche") ?? "";
  const genre = (params.get("genre") ?? "") as Genre | "";
  const sort = params.get("sort") ?? "pertinence";
  const enStock = params.get("enStock") === "1";

  function pushParams(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key === "categorie" && value) next.delete("niche");
    if (key === "niche" && value) next.delete("categorie");
    pushParams(next);
  }

  function clearCategoryFilters() {
    const next = new URLSearchParams(params.toString());
    next.delete("categorie");
    next.delete("niche");
    pushParams(next);
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setParam("q", q.trim());
  }

  function clearFilters() {
    const next = new URLSearchParams();
    const query = params.get("q");
    if (query) next.set("q", query);
    pushParams(next);
    setDrawerOpen(false);
  }

  function clearAll() {
    setQ("");
    pushParams(new URLSearchParams());
    setDrawerOpen(false);
  }

  const hasAdvancedFilters = Boolean(
    categorie ||
      niche ||
      genre ||
      enStock ||
      (sort && sort !== "pertinence") ||
      q
  );

  return (
    // peer + data-loading : la grille de produits (élément suivant) s'estompe pendant le chargement
    <div className="peer space-y-4" data-loading={loading ? "true" : undefined} aria-busy={loading}>
      {loading && (
        <div className="fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden bg-accent/20" aria-hidden>
          <div className="h-full w-1/3 animate-[catalog-progress_1s_ease-in-out_infinite] bg-accent" />
        </div>
      )}
      <form onSubmit={onSearch} className="px-4 md:px-0">
        <label className="relative block">
          <span className="sr-only">Rechercher un produit</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une montre, un bijou, une sandale…"
            className="w-full rounded-control border border-border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </form>

      <div className="space-y-2 px-4 md:px-0">
        <div className="hide-scrollbar -mx-4 flex max-w-[100vw] gap-1.5 overflow-x-auto overscroll-x-contain px-4 md:mx-0 md:max-w-none md:gap-2 md:px-0">
          <button
            type="button"
            onClick={clearCategoryFilters}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition md:h-9 md:rounded-control md:px-3.5 md:text-sm",
              !categorie && !niche
                ? "bg-primary text-white"
                : "border border-border bg-white text-muted hover:text-primary"
            )}
          >
            Toutes
          </button>
          {/* Catégorie demandée par l'URL gardée même vide, pour voir le filtre actif */}
          {CATEGORIES.filter((c) => categories.includes(c) || c === categorie).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setParam("categorie", c)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition md:h-9 md:rounded-control md:px-3.5 md:text-sm",
                categorie === c
                  ? "bg-primary text-white"
                  : "border border-border bg-white text-muted hover:text-primary"
              )}
            >
              {CATEGORIE_LABELS[c]}
            </button>
          ))}
        </div>

        {niches.length > 0 ? (
          <div className="hide-scrollbar -mx-4 flex max-w-[100vw] gap-1.5 overflow-x-auto overscroll-x-contain px-4 md:mx-0 md:max-w-none md:gap-2 md:px-0">
            <span className="flex h-8 shrink-0 items-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted md:h-9">
              Collections
            </span>
            {niches.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setParam("niche", n)}
                className={cn(
                  "h-8 shrink-0 rounded-full px-3 text-xs font-medium transition md:h-9 md:rounded-control md:px-3.5 md:text-sm",
                  niche.toLowerCase() === n.toLowerCase()
                    ? "bg-primary text-inverse"
                    : "border border-border bg-white text-muted hover:text-primary"
                )}
              >
                {nicheLabel(n)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 md:gap-3 md:px-0">
        <p className="flex shrink-0 items-center gap-1.5 text-sm text-muted" aria-live="polite">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </>
          ) : (
            <>
              {resultCount} produit{resultCount !== 1 ? "s" : ""}
            </>
          )}
        </p>
        <div className="flex min-w-0 max-w-full items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-border bg-white px-2.5 py-2 text-sm font-medium text-primary md:hidden"
          >
            <Filter className="h-4 w-4" />
            Filtrer
          </button>
          <label className="hidden items-center gap-2 text-sm md:flex">
            <SlidersHorizontal className="h-4 w-4 text-muted" />
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="rounded-control border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              aria-label="Trier par"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="min-w-0 max-w-[9.5rem] rounded-control border border-border bg-white px-2 py-2 text-sm outline-none focus:border-primary md:hidden"
            aria-label="Trier par"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop advanced filters */}
      <div className="hidden items-center gap-3 px-4 md:flex md:px-0">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Genre
        </span>
        {genres.map((g) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setParam("genre", g.value)}
            className={cn(
              "rounded-control border px-3 py-1.5 text-xs font-medium",
              genre === g.value || (!genre && !g.value)
                ? "border-accent bg-accent/15 text-primary"
                : "border-border text-muted hover:text-primary"
            )}
          >
            {g.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setParam("enStock", enStock ? "" : "1")}
          className={cn(
            "ml-auto rounded-control border px-3 py-1.5 text-xs font-medium",
            enStock
              ? "border-accent bg-accent/15 text-primary"
              : "border-border text-muted hover:text-primary"
          )}
        >
          En stock
        </button>
        {hasAdvancedFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-control border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-primary"
          >
            Tout effacer
          </button>
        ) : null}
      </div>

      {/* Mobile : filtres dans le tiroir du design system */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filtrer"
        footer={
          <>
            <Button variant="outline" onClick={clearFilters}>
              Réinitialiser
            </Button>
            <Button onClick={() => setDrawerOpen(false)} loading={loading}>
              Voir {resultCount} résultat{resultCount !== 1 ? "s" : ""}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <fieldset>
            <legend className="text-xs font-medium uppercase tracking-wider text-muted">Genre</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  aria-pressed={genre === g.value || (!genre && !g.value)}
                  onClick={() => setParam("genre", g.value)}
                  className={cn(
                    "min-h-10 rounded-control border px-3 text-sm font-medium transition-colors",
                    genre === g.value || (!genre && !g.value)
                      ? "border-primary bg-primary text-inverse"
                      : "border-border-strong bg-surface text-fg hover:border-primary"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>
          <Checkbox
            label="En stock uniquement"
            checked={enStock}
            onChange={(e) => setParam("enStock", e.target.checked ? "1" : "")}
          />
        </div>
      </Drawer>
    </div>
  );
}
