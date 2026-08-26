"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

const nav = [
  { href: "/", label: "Boutique" },
  { href: "/recherche", label: "Recherche" },
  { href: "/livraison", label: "Livraison" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const favorites = useWishlistStore((s) => s.ids);
  const cartCount = items.reduce((n, i) => n + i.quantite, 0);
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      router.push("/recherche");
      return;
    }
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-bg-elevated/90 backdrop-blur-md md:block">
      <div className="page-shell flex items-center gap-6 py-3">
        <Link href="/" className="shrink-0">
          <span className="font-display text-xl font-bold tracking-tight text-fg">
            Coin<span className="text-amber">229</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                  ? "bg-amber/15 text-amber"
                  : "text-muted hover:text-fg"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto flex max-w-sm flex-1">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5] text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une montre, un bijou…"
              className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-amber"
            />
          </div>
        </form>

        <div className="flex items-center gap-1">
          <Link
            href="/favoris"
            className="relative rounded-full p-2 text-muted hover:bg-surface hover:text-fg"
            aria-label="Favoris"
          >
            <Heart className="h-5 w-5 stroke-[1.5]" />
            {favorites.length > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose" />
            )}
          </Link>
          <Link
            href="/panier"
            className="relative rounded-full p-2 text-muted hover:bg-surface hover:text-fg"
            aria-label="Panier"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/compte"
            className="rounded-full p-2 text-muted hover:bg-surface hover:text-fg"
            aria-label="Compte"
          >
            <User className="h-5 w-5 stroke-[1.5]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
