"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Categorie, Genre } from "@prisma/client";

const categories: { value: Categorie | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "montre", label: "Montres" },
  { value: "bijou", label: "Bijoux" },
  { value: "sac", label: "Sacs" },
  { value: "lunette", label: "Lunettes" },
];

const genres: { value: Genre | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "unisexe", label: "Unisexe" },
];

export function CatalogFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const categorie = params.get("categorie") ?? "all";
  const genre = params.get("genre") ?? "all";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-3">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 md:px-0">
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => update("categorie", c.value)}
            className={cn(
              "btn-press shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
              categorie === c.value
                ? "scale-[1.02] bg-amber text-navy shadow-[0_8px_20px_rgba(201,162,39,0.3)]"
                : "border border-border bg-white text-muted hover:border-amber/40 hover:text-navy"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 md:px-0">
        {genres.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => update("genre", g.value)}
            className={cn(
              "btn-press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300",
              genre === g.value
                ? "border-amber bg-amber/15 text-amber"
                : "border-border bg-transparent text-muted hover:text-navy"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
