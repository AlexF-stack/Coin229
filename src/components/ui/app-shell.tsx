"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Drawer } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";

export type ShellLink = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Actif seulement sur l'adresse exacte (tableau de bord) */
  exact?: boolean;
  /** Pastille de compteur (messages non lus…) */
  count?: number;
};

export type ShellExtraLink = { href: string; label: string; icon: ComponentType<{ className?: string }>; external?: boolean };

/**
 * Coquille des espaces internes (admin ET vendeur) — un seul langage visuel :
 * sidebar Deep Green, contenu Cream, cartes blanches. Ordinateur : sidebar fixe ;
 * mobile : en-tête + menu en tiroir.
 */
export function AppShell({
  spaceLabel,
  title,
  note,
  links,
  extraLinks = [],
  headline,
  logoutEndpoint,
  logoutRedirect,
  children,
}: {
  /** « Back-office », « Espace vendeur » */
  spaceLabel: string;
  /** Nom affiché sous le libellé (boutique) */
  title: string;
  /** Petite mention sous le titre (ex. « En attente de validation ») */
  note?: string;
  links: ShellLink[];
  extraLinks?: ShellExtraLink[];
  /** Phrase d'en-tête sur ordinateur */
  headline?: string;
  logoutEndpoint: string;
  logoutRedirect: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (l: ShellLink) => (l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`));
  const current = links.find(isActive);

  // Changement de page : le menu mobile se referme
  useEffect(() => setMenuOpen(false), [pathname]);

  async function logout() {
    await fetch(logoutEndpoint, { method: "DELETE" });
    window.location.href = logoutRedirect;
  }

  const brand = (
    <div className="px-5 pb-5 pt-6">
      <Link href="/" aria-label="Retour au site Coin229" className="inline-flex items-center gap-2">
        <BrandLogo variant="mark" height={32} />
        <BrandLogo variant="wordmark" onDark height={34} />
      </Link>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{spaceLabel}</p>
      <p className="mt-1 truncate font-display text-[15px] font-semibold text-inverse">{title}</p>
      {note && <p className="mt-1 text-xs text-accent">{note}</p>}
    </div>
  );

  const nav = (variant: "sidebar" | "drawer") => (
    <nav aria-label={spaceLabel} className="flex flex-col gap-0.5">
      {links.map((l) => {
        const active = isActive(l);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors",
              variant === "sidebar"
                ? active
                  ? "bg-white/10 text-inverse before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-accent"
                  : "text-inverse/70 hover:bg-white/5 hover:text-inverse"
                : active
                  ? "bg-primary-soft text-primary"
                  : "text-fg-secondary hover:bg-background hover:text-fg"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.75]" />
            <span className="flex-1">{l.label}</span>
            {l.count != null && l.count > 0 && (
              <span className="min-w-5 rounded-pill bg-accent px-1.5 text-center text-[11px] font-semibold leading-5 text-primary">
                {l.count > 99 ? "99+" : l.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const extras = (variant: "sidebar" | "drawer") => (
    <div className="flex flex-col gap-0.5">
      {extraLinks.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            target={l.external ? "_blank" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm",
              variant === "sidebar" ? "text-inverse/60 hover:bg-white/5 hover:text-inverse" : "text-fg-secondary hover:bg-background"
            )}
          >
            <Icon className="h-[18px] w-[18px] stroke-[1.75]" />
            {l.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-control px-3 text-left text-sm",
          variant === "sidebar" ? "text-inverse/60 hover:bg-white/5 hover:text-inverse" : "text-error hover:bg-error-soft"
        )}
      >
        <LogOut className="h-[18px] w-[18px] stroke-[1.75]" />
        Déconnexion
      </button>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background text-fg">
      {/* Ordinateur : sidebar Deep Green */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-surface-inverse lg:flex">
        {brand}
        <div className="mx-5 h-px bg-white/10" />
        <div className="flex-1 overflow-y-auto p-3">{nav("sidebar")}</div>
        <div className="border-t border-white/10 p-3">{extras("sidebar")}</div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col lg:pl-64">
        {/* En-tête : mobile = marque + page + menu ; ordinateur = phrase d'accroche */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-control text-primary hover:bg-background lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-ink">{spaceLabel}</p>
            <p className="truncate font-display text-sm font-semibold text-fg">{current?.label ?? title}</p>
          </div>
          <p className="hidden flex-1 text-sm text-muted lg:block">{headline}</p>
          <button
            type="button"
            onClick={logout}
            aria-label="Déconnexion"
            title="Déconnexion"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-fg-secondary hover:bg-background hover:text-fg lg:hidden"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Mobile : menu en tiroir */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={spaceLabel} description={title}>
        <div className="space-y-4">
          {nav("drawer")}
          <div className="border-t border-border pt-3">{extras("drawer")}</div>
        </div>
      </Drawer>
    </div>
  );
}
