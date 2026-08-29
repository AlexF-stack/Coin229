import Image from "next/image";
import Link from "next/link";
import type { Categorie } from "@prisma/client";
import { CATEGORIES, CATEGORIE_LABELS } from "@/lib/constants";

type Props = {
  images: Partial<Record<Categorie, string>>;
};

export function CategoryShowcase({ images }: Props) {
  return (
    <section aria-labelledby="categories-heading" className="px-4 md:px-0">
      <h2
        id="categories-heading"
        className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl"
      >
        Explorer par catégorie
      </h2>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((categorie) => {
          const image = images[categorie] ?? "/placeholder-product.svg";
          const label = CATEGORIE_LABELS[categorie];
          return (
            <li key={categorie}>
              <Link
                href={`/boutique?categorie=${categorie}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-navy"
              >
                <Image
                  src={image}
                  alt={label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  loading="lazy"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-xl font-semibold text-white">
                    {label}
                  </p>
                  <span className="mt-2 inline-flex text-sm font-medium text-amber transition group-hover:translate-x-0.5">
                    Découvrir →
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
