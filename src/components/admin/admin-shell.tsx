"use client";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ExternalLink,
  Bell,
  Store,
  Wallet,
} from "lucide-react";
import { AppShell, type ShellLink } from "@/components/ui/app-shell";

const links: ShellLink[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/vendeurs", label: "Vendeurs", icon: Store },
  { href: "/admin/payouts", label: "Reversements", icon: Wallet },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
];

type Props = {
  boutique: string;
  children: React.ReactNode;
};

/** Back-office : même langage visuel que tout Coin229 (voir AppShell) */
export function AdminShell({ boutique, children }: Props) {
  return (
    <AppShell
      spaceLabel="Back-office"
      title={boutique}
      links={links}
      extraLinks={[{ href: "/", label: "Voir la boutique", icon: ExternalLink, external: true }]}
      headline="Gestion de la marketplace : stock, commandes, vendeurs"
      logoutEndpoint="/api/admin/login"
      logoutRedirect="/admin/login"
    >
      {children}
    </AppShell>
  );
}
