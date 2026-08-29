import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { fetchProducts } from "@/lib/catalog";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Panier",
  description: "Votre panier Coin229 — accessoires mode, prix en FCFA.",
  path: "/panier",
  noIndex: true,
});

export default async function CartPage() {
  const { products } = await fetchProducts();
  const suggestions = products.slice(0, 4);

  return (
    <div>
      <header className="border-b border-border/60 px-4 pb-3 pt-5 md:border-0 md:px-0 md:pb-0 md:pt-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Coin229
        </p>
        <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">
          Mon panier
        </h1>
      </header>
      <CartView suggestions={suggestions} />
    </div>
  );
}
