"use client";

import { ProductCard } from "@/components/product/product-card";
import { StaggerReveal } from "@/components/motion/reveal";
import type { ProductCardData } from "@/lib/constants";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <StaggerReveal className="grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-3 md:px-0 lg:grid-cols-4 lg:gap-5">
      {products.map((product) => (
        <div key={product.id} data-reveal-item>
          <ProductCard product={product} />
        </div>
      ))}
    </StaggerReveal>
  );
}
