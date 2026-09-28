import Image from "next/image";
import Link from "next/link";
import type { Categorie } from "@prisma/client";
import { CATEGORIES, CATEGORIE_LABELS } from "@/lib/constants";

type Props = {
  images: Partial<Record<Categorie, string>>;
};

/**
 * Entrées catégories — pastilles mobiles, tuiles image desktop.
 */
export function CategoryShowcase({ images }: Props) {
  return (
    <section aria-labelledby="categories-heading" className="px-4 md:px-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber">
            Explorer
          </p>
          <h2
            id="categories-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-navy md:text-3xl"
          >
            Votre style. Quatre chemins.
          </h2>
        </div>
        <Link
          href="/boutique"
          className="text-sm font-semibold text-navy underline decoration-amber decoration-2 underline-offset-4"
        >
          Tout voir
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-4 gap-1.5 md:mt-8 md:gap-4">
        {CATEGORIES.map((categorie, i) => {
          const image = images[categorie] ?? "/placeholder-product.svg";
          const label = CATEGORIE_LABELS[categorie];
          const n = String(i + 1).padStart(2, "0");
          return (
            <li key={categorie}>
              <Link
                href={`/boutique?categorie=${categorie}`}
                className="group flex flex-col items-center gap-1 text-center md:relative md:block md:aspect-[4/5] md:overflow-hidden md:bg-navy"
              >
                <span className="relative mx-auto block h-14 w-14 shrink-0 overflow-hidden rounded-full bg-cream ring-1 ring-border sm:h-16 sm:w-16 md:absolute md:inset-0 md:mx-0 md:h-full md:w-full md:max-w-none md:rounded-none md:ring-0">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 64px, 25vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.04]"
                  />
                </span>

                <span className="line-clamp-1 w-full text-[10px] font-medium leading-tight text-navy sm:text-[11px] md:sr-only">
                  {label}
                </span>

                <span
                  className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-navy/90 via-navy/30 to-transparent md:block"
                  aria-hidden
                />
                <span className="absolute inset-x-0 bottom-0 hidden p-5 text-left md:block">
                  <span className="mb-2 block font-display text-[11px] font-semibold tracking-[0.16em] text-amber">
                    {n}
                  </span>
                  <span className="block font-display text-xl font-semibold text-white">
                    {label}
                  </span>
                  <span className="mt-2 inline-flex text-sm font-medium text-white/80 transition group-hover:translate-x-0.5 group-hover:text-amber">
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
