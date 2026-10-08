"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Megaphone,
  Store,
  ExternalLink,
  MessageCircle,
  User,
  Wallet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/vendeur/espace",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/vendeur/espace/produits", label: "Produits", icon: Package },
  { href: "/vendeur/espace/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/vendeur/espace/messages", label: "Messages", icon: MessageCircle, badge: true },
  { href: "/vendeur/espace/finances", label: "Finances", icon: Wallet },
  { href: "/vendeur/espace/profil", label: "Profil", icon: User },
  { href: "/vendeur/espace/pub", label: "Liens pub", icon: Megaphone },
];

type Props = {
  boutique: string;
  slug: string | null;
  statut: string;
  unreadMessages?: number;
  children: React.ReactNode;
};

export function VendorShell({
  boutique,
  slug,
  statut,
  unreadMessages,
  children,
}: Props) {
  const pathname = usePathname();
  const storeHref = slug ? `/vendeur/${slug}` : null;

  async function logout() {
    await fetch("/api/vendor/login", { method: "DELETE" });
    window.location.href = "/vendeur/login";
  }

  return (
    <div className="vendor-shell flex min-h-dvh bg-[#0c0d12] text-[#e8eaed]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-[#14161c] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Espace vendeur
          </p>
          <p className="mt-1 truncate font-semibold text-white">{boutique}</p>
          {statut !== "actif" && (
            <p className="mt-1 text-[11px] text-amber-300/90">
              {statut === "en_attente"
                ? "En attente de validation"
                : "Compte suspendu"}
            </p>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map(({ href, label, icon: Icon, exact, badge }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            const showBadge = badge && unreadMessages != null && unreadMessages > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-amber-500/15 font-medium text-amber-300"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 stroke-[1.5]" />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-[#0c0d12]">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          {storeHref && (
            <Link
              href={storeHref}
              target="_blank"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/45 hover:bg-white/5 hover:text-white"
            >
              <Store className="h-4 w-4 stroke-[1.5]" />
              Ma vitrine
            </Link>
          )}
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/45 hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 stroke-[1.5]" />
            Coin229
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/45 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#14161c]/95 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Store className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold">Vendeur</span>
            </div>
            <p className="hidden text-sm text-white/50 lg:block">
              Produits, commandes & partage
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {links.map(({ href, label, exact, badge }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              const showBadge = badge && unreadMessages != null && unreadMessages > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative shrink-0 rounded-md px-2.5 py-1.5 text-xs",
                    active
                      ? "bg-amber-500/20 text-amber-300"
                      : "text-white/50"
                  )}
                >
                  {label}
                  {showBadge && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
