import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/constants";

type Props = {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  id?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function ProductRail({
  title,
  subtitle,
  products,
  id,
  ctaHref,
  ctaLabel,
}: Props) {
  if (!products.length) return null;

  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className="scroll-mt-24 px-4 md:px-0"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id={id ? `${id}-heading` : undefined}
            className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 max-w-xl text-sm text-muted md:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        {ctaHref && ctaLabel ? (
          <Link
            href={ctaHref}
            className="text-sm font-semibold text-navy underline decoration-amber decoration-2 underline-offset-4"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
