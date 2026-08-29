"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";

const nav = [
  { href: "/", label: "Accueil", match: (p: string) => p === "/" },
  {
    href: "/boutique",
    label: "Boutique",
    match: (p: string) => p.startsWith("/boutique") || p.startsWith("/recherche"),
  },
  {
    href: "/a-propos",
    label: "À propos",
    match: (p: string) => p.startsWith("/a-propos"),
  },
];

function HeaderInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const favorites = useWishlistStore((s) => s.ids);
  const cartCount = items.reduce((n, i) => n + i.quantite, 0);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/boutique")) {
      setQ(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      query ? `/boutique?q=${encodeURIComponent(query)}` : "/boutique"
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-border/80 bg-white/95 shadow-card backdrop-blur-md"
          : "border-transparent bg-cream/90 backdrop-blur-sm"
      )}
    >
      <div className="page-shell flex items-center gap-3 py-3 md:gap-6 md:py-3.5">
        <button
          type="button"
          className="rounded-[10px] p-2 text-navy md:hidden"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? (
            <X className="h-5 w-5 stroke-[1.5]" />
          ) : (
            <Menu className="h-5 w-5 stroke-[1.5]" />
          )}
        </button>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Coin229 — Accueil"
        >
          <BrandLogo variant="mark" height={30} priority />
          <BrandLogo variant="wordmark" height={32} />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-navy underline decoration-amber decoration-2 underline-offset-8"
                    : "text-muted hover:text-navy"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form
          onSubmit={onSearch}
          className="ml-auto hidden max-w-xs flex-1 lg:flex"
        >
          <label className="relative w-full">
            <span className="sr-only">Rechercher</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-[10px] border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-navy"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <button
            type="button"
            className="rounded-[10px] p-2 text-navy lg:hidden"
            aria-label="Rechercher"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5 stroke-[1.5]" />
          </button>
          <Link
            href="/favoris"
            className="relative hidden rounded-[10px] p-2 text-navy transition hover:bg-white sm:inline-flex"
            aria-label="Favoris"
          >
            <Heart className="h-5 w-5 stroke-[1.5]" />
            {favorites.length > 0 && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber" />
            )}
          </Link>
          <Link
            href="/panier"
            className="relative rounded-[10px] p-2 text-navy transition hover:bg-white"
            aria-label={`Panier${cartCount ? `, ${cartCount} article(s)` : ""}`}
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-navy px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/compte"
            className="hidden rounded-[10px] p-2 text-navy transition hover:bg-white md:inline-flex"
            aria-label="Compte"
          >
            <User className="h-5 w-5 stroke-[1.5]" />
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form
          onSubmit={onSearch}
          className="border-t border-border bg-white px-4 py-3 lg:hidden"
        >
          <label className="relative block">
            <span className="sr-only">Rechercher</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une montre, un sac…"
              className="w-full rounded-[10px] border border-border bg-cream py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy"
            />
          </label>
        </form>
      )}

      {menuOpen && (
        <nav
          className="border-t border-border bg-white px-4 py-3 md:hidden"
          aria-label="Menu principal"
        >
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-[10px] px-3 py-2.5 text-sm font-medium text-navy hover:bg-cream"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/favoris"
                className="block rounded-[10px] px-3 py-2.5 text-sm font-medium text-navy hover:bg-cream"
              >
                Favoris
              </Link>
            </li>
            <li>
              <Link
                href="/compte"
                className="block rounded-[10px] px-3 py-2.5 text-sm font-medium text-navy hover:bg-cream"
              >
                Compte
              </Link>
            </li>
            <li>
              <Link
                href="/livraison"
                className="block rounded-[10px] px-3 py-2.5 text-sm font-medium text-navy hover:bg-cream"
              >
                Livraison
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-40 border-b border-transparent bg-cream/90 py-3">
          <div className="page-shell h-10" />
        </header>
      }
    >
      <HeaderInner />
    </Suspense>
  );
}
