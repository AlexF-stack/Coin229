"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, CATEGORIE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Categorie, Genre } from "@prisma/client";

type Props = {
  resultCount: number;
};

const genres: { value: Genre | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "unisexe", label: "Unisexe" },
];

const sorts = [
  { value: "pertinence", label: "Pertinence" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
];

export function BoutiqueToolbar({ resultCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const categorie = (params.get("categorie") ?? "") as Categorie | "";
  const genre = (params.get("genre") ?? "") as Genre | "";
  const sort = params.get("sort") ?? "pertinence";
  const enStock = params.get("enStock") === "1";

  function pushParams(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
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

  const hasAdvancedFilters = Boolean(categorie || genre || enStock || (sort && sort !== "pertinence") || q);

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="px-4 md:px-0">
        <label className="relative block">
          <span className="sr-only">Rechercher un produit</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une montre, un sac, une chaîne…"
            className="w-full rounded-[10px] border border-border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-navy"
          />
        </label>
      </form>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 md:px-0">
        <button
          type="button"
          onClick={() => setParam("categorie", "")}
          className={cn(
            "shrink-0 rounded-[10px] px-3.5 py-2 text-sm font-medium transition",
            !categorie
              ? "bg-navy text-white"
              : "border border-border bg-white text-muted hover:text-navy"
          )}
        >
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setParam("categorie", c)}
            className={cn(
              "shrink-0 rounded-[10px] px-3.5 py-2 text-sm font-medium transition",
              categorie === c
                ? "bg-navy text-white"
                : "border border-border bg-white text-muted hover:text-navy"
            )}
          >
            {CATEGORIE_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 md:px-0">
        <p className="text-sm text-muted">
          {resultCount} produit{resultCount !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-white px-3 py-2 text-sm font-medium text-navy md:hidden"
          >
            <Filter className="h-4 w-4" />
            Filtrer
          </button>
          <label className="hidden items-center gap-2 text-sm md:flex">
            <SlidersHorizontal className="h-4 w-4 text-muted" />
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy"
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
            className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy md:hidden"
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
              "rounded-[10px] border px-3 py-1.5 text-xs font-medium",
              genre === g.value || (!genre && !g.value)
                ? "border-amber bg-amber/15 text-navy"
                : "border-border text-muted hover:text-navy"
            )}
          >
            {g.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setParam("enStock", enStock ? "" : "1")}
          className={cn(
            "ml-auto rounded-[10px] border px-3 py-1.5 text-xs font-medium",
            enStock
              ? "border-amber bg-amber/15 text-navy"
              : "border-border text-muted hover:text-navy"
          )}
        >
          En stock
        </button>
        {hasAdvancedFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-[10px] border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-navy"
          >
            Tout effacer
          </button>
        ) : null}
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Fermer les filtres"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="safe-pb absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-navy">
                Filtrer
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-[10px] p-2 text-muted"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Genre
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setParam("genre", g.value)}
                  className={cn(
                    "rounded-[10px] border px-3 py-2 text-sm",
                    genre === g.value || (!genre && !g.value)
                      ? "border-navy bg-navy text-white"
                      : "border-border"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <label className="mt-5 flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={enStock}
                onChange={(e) =>
                  setParam("enStock", e.target.checked ? "1" : "")
                }
                className="h-4 w-4 accent-[var(--color-navy)]"
              />
              En stock uniquement
            </label>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-secondary flex-1"
              >
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="btn btn-primary flex-1"
              >
                Voir {resultCount} résultat{resultCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
