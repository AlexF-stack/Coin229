"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Categorie, Genre } from "@prisma/client";

const categories: { value: Categorie | "all"; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "montre", label: "Montres" },
  { value: "bijou", label: "Bijoux" },
  { value: "sac", label: "Sacs" },
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
              "shrink-0 rounded-[20px] px-4 py-2 text-sm font-medium transition-colors",
              categorie === c.value
                ? "bg-amber text-bg"
                : "bg-card/80 text-muted backdrop-blur-sm md:border md:border-border md:bg-card"
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
              "shrink-0 rounded-[20px] border px-3.5 py-1.5 text-xs font-medium transition-colors",
              genre === g.value
                ? "border-amber bg-amber/15 text-amber"
                : "border-border bg-transparent text-muted"
            )}
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
