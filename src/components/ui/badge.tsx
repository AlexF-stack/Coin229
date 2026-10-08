import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_MAPS, type StatusKind, type StatusTone } from "@/lib/status";

export type BadgeTone = StatusTone | "brand" | "accent";

const SOFT: Record<BadgeTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-neutral",
  brand: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent-ink",
};

const SOLID: Record<BadgeTone, string> = {
  success: "bg-success text-inverse",
  warning: "bg-warning text-inverse",
  error: "bg-error text-inverse",
  info: "bg-info text-inverse",
  neutral: "bg-neutral text-inverse",
  brand: "bg-primary text-inverse",
  accent: "bg-accent text-primary",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  /** soft (par défaut) : fond léger ; solid : fond plein */
  variant?: "soft" | "solid";
  /** Pastille colorée avant le texte */
  dot?: boolean;
  icon?: ReactNode;
};

export function Badge({ tone = "neutral", variant = "soft", dot = false, icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-badge px-2 py-0.5 text-xs font-medium",
        variant === "soft" ? SOFT[tone] : SOLID[tone],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {icon && <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
      {children}
    </span>
  );
}

/** Statut métier → libellé et couleur uniques (src/lib/status.ts) */
export function StatusBadge<K extends StatusKind>({
  kind,
  status,
  className,
}: {
  kind: K;
  status: keyof (typeof STATUS_MAPS)[K];
  className?: string;
}) {
  const def = (STATUS_MAPS[kind] as Record<string, { label: string; tone: StatusTone }>)[status as string];
  if (!def) return null;
  return (
    <Badge tone={def.tone} dot className={className}>
      {def.label}
    </Badge>
  );
}
