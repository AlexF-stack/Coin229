"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b border-border/80 bg-white/85 shadow-[0_8px_30px_rgba(2,11,38,0.06)] backdrop-blur-xl"
          : "border-b border-transparent bg-white/70 backdrop-blur-md"
      )}
    >
      <div
        className={cn(
          "page-shell flex items-center gap-3 px-4 transition-[padding] duration-300 md:gap-6 md:px-0",
          scrolled ? "py-2 md:py-2.5" : "py-2.5 md:py-3.5"
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <BrandLogo variant="mark" height={scrolled ? 28 : 32} priority />
          <BrandLogo variant="wordmark" height={scrolled ? 30 : 34} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-amber/10 text-amber"
                    : "text-muted hover:text-navy"
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-amber md:hidden" />
                )}
              </Link>
            );
          })}
        </nav>

        <form
          onSubmit={onSearch}
          className="ml-auto hidden max-w-sm flex-1 md:flex"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.5] text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Montre, bijou, sac, lunettes…"
              className="w-full rounded-full border border-border bg-bg-elevated py-2 pl-9 pr-3 text-sm outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            href="/favoris"
            className="relative rounded-full p-2 text-muted transition hover:bg-surface hover:text-navy active:scale-95"
            aria-label="Favoris"
          >
            <Heart className="h-5 w-5 stroke-[1.5]" />
            {favorites.length > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-amber" />
            )}
          </Link>
          <Link
            href="/panier"
            className="relative hidden rounded-full p-2 text-muted transition hover:bg-surface hover:text-navy active:scale-95 md:inline-flex"
            aria-label="Panier"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-[pop_0.35s_ease-out] items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-navy">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/compte"
            className="hidden rounded-full p-2 text-muted transition hover:bg-surface hover:text-navy active:scale-95 md:inline-flex"
            aria-label="Compte"
          >
            <User className="h-5 w-5 stroke-[1.5]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
