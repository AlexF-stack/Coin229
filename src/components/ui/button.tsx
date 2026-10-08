import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "accent" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-inverse hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-background text-primary hover:bg-primary-soft active:bg-primary-soft",
  outline: "border border-primary/25 bg-surface text-primary hover:border-primary hover:bg-background",
  // Gold : action de marque mise en avant (ex. sur fond Deep Green), avec parcimonie
  accent: "bg-accent text-primary hover:bg-accent-hover",
  ghost: "bg-transparent text-primary hover:bg-background",
  destructive: "bg-error text-inverse hover:bg-error/90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-5 text-sm", // 44px : zone tactile confortable
  lg: "min-h-12 px-6 text-base",
};

/** Classes d'un bouton — aussi pour un <Link> ou un <a> qui doit ressembler à un bouton */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-control font-display font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Affiche un indicateur et bloque le bouton pendant une action */
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading = false, className, children, disabled, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
