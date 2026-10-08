import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** Espacement intérieur : none (contenu bord à bord, ex. liste), sm, md (défaut) */
  padding?: "none" | "sm" | "md";
  /** Carte cliquable : survol */
  interactive?: boolean;
  as?: "div" | "section" | "article" | "li";
};

const PADDING = { none: "", sm: "p-3 md:p-4", md: "p-4 md:p-5" };

/** Carte Coin229 : même surface, bordure, rayon et ombre partout (boutique, tableaux de bord, statistiques) */
export function Card({ padding = "md", interactive = false, as = "div", className, ...props }: CardProps) {
  // Même rendu quelle que soit la balise (div, section, article, li)
  const Tag = as as "div";
  return (
    <Tag
      className={cn(
        "rounded-card border border-border bg-surface shadow-card",
        PADDING[padding],
        interactive && "transition-shadow hover:border-primary/20 hover:shadow-raised",
        className
      )}
      {...props}
    />
  );
}

/** En-tête de carte : titre (+ description) à gauche, actions à droite */
export function CardHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Indicateur chiffré (tableaux de bord admin / vendeur) */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Mise en avant d'une valeur qui demande une action */
  tone?: "warning" | "success";
}) {
  return (
    <Card>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-fg md:text-3xl">{value}</p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "warning" ? "font-medium text-warning" : tone === "success" ? "text-success" : "text-muted"
          )}
        >
          {hint}
        </p>
      )}
    </Card>
  );
}
