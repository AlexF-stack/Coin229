"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, User, Heart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/recherche", label: "Chercher", icon: Search },
  { href: "/panier", label: "Panier", icon: ShoppingBag },
  { href: "/favoris", label: "Favoris", icon: Heart },
  { href: "/compte", label: "Compte", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(items.reduce((n, i) => n + i.quantite, 0));
  }, [items]);

  return (
    <nav className="safe-pb fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 shadow-[0_-8px_30px_rgba(2,11,38,0.06)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-[3.75rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] transition-colors",
                active ? "text-amber" : "text-muted hover:text-navy"
              )}
            >
              <Icon className="h-5 w-5 stroke-[1.5]" />
              {href === "/panier" && count > 0 && (
                <span className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-navy">
                  {count}
                </span>
              )}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
