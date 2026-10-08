"use client";

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
} from "lucide-react";
import { AppShell, type ShellLink, type ShellExtraLink } from "@/components/ui/app-shell";

type Props = {
  boutique: string;
  slug: string | null;
  statut: string;
  unreadMessages?: number;
  children: React.ReactNode;
};

/** Espace vendeur : même langage visuel que tout Coin229 (voir AppShell) */
export function VendorShell({ boutique, slug, statut, unreadMessages, children }: Props) {
  const links: ShellLink[] = [
    { href: "/vendeur/espace", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/vendeur/espace/produits", label: "Produits", icon: Package },
    { href: "/vendeur/espace/commandes", label: "Commandes", icon: ShoppingCart },
    { href: "/vendeur/espace/messages", label: "Messages", icon: MessageCircle, count: unreadMessages },
    { href: "/vendeur/espace/finances", label: "Finances", icon: Wallet },
    { href: "/vendeur/espace/profil", label: "Profil", icon: User },
    { href: "/vendeur/espace/pub", label: "Liens pub", icon: Megaphone },
  ];
  const extraLinks: ShellExtraLink[] = [
    ...(slug ? [{ href: `/vendeur/${slug}`, label: "Ma vitrine", icon: Store, external: true }] : []),
    { href: "/", label: "Coin229", icon: ExternalLink, external: true },
  ];
  return (
    <AppShell
      spaceLabel="Espace vendeur"
      title={boutique}
      note={statut === "actif" ? undefined : statut === "en_attente" ? "En attente de validation" : "Compte suspendu"}
      links={links}
      extraLinks={extraLinks}
      headline="Produits, commandes et partage de ta boutique"
      logoutEndpoint="/api/vendor/login"
      logoutRedirect="/vendeur/login"
    >
      {children}
    </AppShell>
  );
}
