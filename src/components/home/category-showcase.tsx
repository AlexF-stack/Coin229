import Image from "next/image";
import Link from "next/link";
import type { Categorie } from "@prisma/client";
import { CATEGORIE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  /** Seulement les catégories qui ont des produits */
  categories: Categorie[];
  images: Partial<Record<Categorie, string>>;
};

/**
 * Entrées catégories — pastilles mobiles, tuiles image desktop.
 */
/** Classes complètes (Tailwind ne voit pas les noms construits dynamiquement) */
const COLS: Record<number, string> = {
  1: "grid-cols-1 md:max-w-sm",
  2: "grid-cols-2 md:max-w-2xl",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};
const MD_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

export function CategoryShowcase({ categories, images }: Props) {
  const count = Math.min(categories.length, 5);
  return (
    <section aria-labelledby="categories-heading" className="px-4 md:px-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent-ink">
            Explorer
          </p>
          <h2
            id="categories-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-primary md:text-3xl"
          >
            Votre style. Votre rayon.
          </h2>
        </div>
        <Link
          href="/boutique"
          className="text-sm font-semibold text-primary underline decoration-accent decoration-2 underline-offset-4"
        >
          Tout voir
        </Link>
      </div>

      <ul className={cn("mt-6 grid gap-1.5 md:mt-8 md:gap-4", COLS[count], MD_COLS[count])}>
        {categories.map((categorie, i) => {
          const image = images[categorie] ?? "/placeholder-product.svg";
          const label = CATEGORIE_LABELS[categorie];
          const n = String(i + 1).padStart(2, "0");
          return (
            <li key={categorie}>
              <Link
                href={`/boutique?categorie=${categorie}`}
                className="group flex flex-col items-center gap-1 text-center md:relative md:block md:aspect-[4/5] md:overflow-hidden md:bg-primary"
              >
                <span className="relative mx-auto block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-background ring-1 ring-border sm:h-16 sm:w-16 md:absolute md:inset-0 md:mx-0 md:h-full md:w-full md:max-w-none md:rounded-none md:ring-0">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes={`(max-width: 768px) 64px, ${Math.round(100 / count)}vw`}
                    loading="lazy"
                    className="object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
                  />
                </span>

                <span className="line-clamp-1 w-full text-[10px] font-medium leading-tight text-primary sm:text-[11px] md:sr-only">
                  {label}
                </span>

                <span
                  className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-primary/90 via-primary/30 to-transparent md:block"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 hidden p-5 text-left md:block">
                  <span className="mb-2 block font-display text-[11px] font-semibold tracking-[0.16em] text-accent">
                    {n}
                  </span>
                  <span className="block font-display text-xl font-semibold text-white">
                    {label}
                  </span>
                  <span className="mt-2 inline-flex text-sm font-medium text-white/80 transition group-hover:translate-x-0.5 group-hover:text-accent">
                    Découvrir →
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
