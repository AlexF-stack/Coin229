import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bloc de chargement (même teinte partout) */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-control bg-background", className)} aria-hidden />;
}

/** Chargement en cours (dans un bouton, une carte, une liste) */
export function Spinner({ label = "Chargement…", className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-sm text-muted", className)}>
      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

/** Rien à afficher (liste vide, aucun résultat) */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-10 text-center",
        className
      )}
    >
      {icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </span>
      )}
      <p className="font-display text-base font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Erreur de chargement d'un bloc (avec action pour réessayer) */
export function ErrorState({
  title = "Impossible de charger ces informations",
  description,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-card border border-error/20 bg-error-soft px-6 py-10 text-center", className)}>
      <AlertCircle className="mb-3 h-6 w-6 text-error" aria-hidden />
      <p className="font-display text-base font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
