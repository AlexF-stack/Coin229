import Image from "next/image";
import Link from "next/link";
import type { Categorie } from "@prisma/client";
import { CATEGORIES, CATEGORIE_LABELS } from "@/lib/constants";

type Props = {
  images: Partial<Record<Categorie, string>>;
};

/**
 * Entrées catégories — densé type Shein sur mobile (pastilles 56px),
 * cartes image à partir de md. Un seul lien par catégorie.
 */
export function CategoryShowcase({ images }: Props) {
  return (
    <section aria-labelledby="categories-heading" className="px-4 md:px-0">
      <div className="flex items-end justify-between gap-3">
        <h2
          id="categories-heading"
          className="font-display text-base font-semibold tracking-tight text-navy md:text-2xl md:font-bold"
        >
          Catégories
        </h2>
        <Link
          href="/boutique"
          className="text-xs font-medium text-muted transition hover:text-navy md:text-sm"
        >
          Tout voir
        </Link>
      </div>

      <ul className="mt-3 grid grid-cols-4 gap-1.5 md:mt-6 md:gap-4">
        {CATEGORIES.map((categorie) => {
          const image = images[categorie] ?? "/placeholder-product.svg";
          const label = CATEGORIE_LABELS[categorie];
          return (
            <li key={categorie}>
              <Link
                href={`/boutique?categorie=${categorie}`}
                className="group flex flex-col items-center gap-1 text-center md:relative md:block md:aspect-[4/5] md:overflow-hidden md:rounded-xl md:bg-navy"
              >
                <span className="relative mx-auto block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-cream ring-1 ring-border sm:h-16 sm:w-16 md:absolute md:inset-0 md:mx-0 md:h-full md:w-full md:max-w-none md:rounded-none md:ring-0">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 64px, 25vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.05]"
                  />
                </span>

                <span className="line-clamp-1 w-full text-[10px] font-medium leading-tight text-navy sm:text-[11px] md:sr-only">
                  {label}
                </span>

                <span
                  className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-navy/85 via-navy/25 to-transparent md:block"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 hidden p-5 text-left md:block">
                  <span className="block font-display text-xl font-semibold text-white">
                    {label}
                  </span>
                  <span className="mt-2 inline-flex text-sm font-medium text-amber transition group-hover:translate-x-0.5">
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
