import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "error";

const TONES: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: { box: "border-info/20 bg-info-soft text-info", icon: <Info aria-hidden /> },
  success: { box: "border-success/20 bg-success-soft text-success", icon: <CheckCircle2 aria-hidden /> },
  warning: { box: "border-warning/25 bg-warning-soft text-warning", icon: <AlertTriangle aria-hidden /> },
  error: { box: "border-error/20 bg-error-soft text-error", icon: <AlertCircle aria-hidden /> },
};

/** Message dans la page (info, succès, attention, erreur) */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-card border px-4 py-3 text-sm", t.box, className)}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:h-4 [&_svg]:w-4">{t.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-fg-secondary", title && "mt-0.5")}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer le message"
          className="-m-1 shrink-0 rounded-badge p-1 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
