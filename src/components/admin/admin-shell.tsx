"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ExternalLink,
  Boxes,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

type Props = {
  boutique: string;
  children: React.ReactNode;
};

/** Back-office distinct : sombre utilitaire, sidebar, pas de chrome boutique */
export function AdminShell({ boutique, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="admin-shell flex min-h-dvh bg-[#0a0b0f] text-[#e8eaed]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-[#111318] lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
            Back-office
          </p>
          <p className="mt-1 truncate font-semibold text-white">{boutique}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-emerald-500/15 font-medium text-emerald-300"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 stroke-[1.5]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/45 hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 stroke-[1.5]" />
            Voir la boutique
          </Link>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/login", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-white/45 hover:bg-white/5 hover:text-white"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#111318]/95 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <Boxes className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <p className="hidden text-sm text-white/50 lg:block">
            Gestion stock & commandes
          </p>
          <div className="flex gap-1 overflow-x-auto lg:hidden">
            {links.map(({ href, label, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1.5 text-xs",
                    active
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-white/50"
                  )}
                >
                  {label}
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
