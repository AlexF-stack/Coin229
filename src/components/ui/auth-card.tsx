import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/feedback";

/**
 * Pages d'authentification (admin, vendeur) : fond Cream, logo Coin229,
 * carte blanche centrée — on reste visiblement dans Coin229.
 */
export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  /** Espace concerné : « Back-office », « Espace vendeur » */
  eyebrow: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Sous la carte (lien d'inscription…) */
  footer?: ReactNode;
  /** Formulaire long (inscription) */
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Link href="/" aria-label="Retour au site Coin229" className="mb-6 flex items-center gap-2">
        {/* Même logo que l’en-tête du site */}
        <BrandLogo variant="mark" height={40} priority />
        <BrandLogo variant="wordmark" height={38} />
      </Link>
      <Card className={wide ? "w-full max-w-lg" : "w-full max-w-sm"}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-ink">{eyebrow}</p>
        <h1 className="mt-1 font-display text-xl font-semibold text-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        <div className="mt-5">{children}</div>
      </Card>
      {footer && <div className="mt-5 text-center text-sm text-fg-secondary">{footer}</div>}
    </div>
  );
}

/** Chargement d'une page d'authentification (Suspense) */
export function AuthFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}
