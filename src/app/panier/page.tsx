import { CartView } from "@/components/cart/cart-view";

export const metadata = {
  title: "Panier",
};

export default function CartPage() {
  return (
    <div>
      <header className="border-b border-border/60 px-4 pb-3 pt-5 md:border-0 md:px-0 md:pb-0 md:pt-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Boutique
        </p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          Mon panier
        </h1>
      </header>
      <CartView />
    </div>
  );
}
