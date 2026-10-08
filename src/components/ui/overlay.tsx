"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Fenêtres (Modal) et tiroirs (Drawer) Coin229 — même base partout :
 * <dialog> natif (focus piégé, Échap), fond Deep Green translucide,
 * surface blanche, rayon « panel », titre + bouton Fermer, animation courte.
 */

type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Boutons d'action, alignés à droite */
  footer?: ReactNode;
  /** Masquer la croix (ex. fenêtre de confirmation avec ses propres boutons) */
  hideClose?: boolean;
  className?: string;
};

function useDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (open && el && !el.open) el.showModal();
  }, [open]);
  return ref;
}

function Shell({
  variant,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  hideClose,
  className,
  frameClass,
}: OverlayProps & { variant: "modal" | "drawer"; frameClass: string }) {
  const ref = useDialog(open);
  const titleId = useId();
  const descId = useId();
  if (!open || typeof document === "undefined") return null;
  // Portail : la fenêtre ne doit pas se retrouver dans un <a> (carte produit) ou une liste
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // stopPropagation : l'appelant peut être dans un <Link>
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "overflow-visible bg-transparent p-0 text-fg backdrop:bg-overlay backdrop:backdrop-blur-[2px]",
        variant === "modal" ? "m-auto w-[calc(100%-2rem)]" : "m-0 ml-auto h-dvh max-h-none w-full max-w-md",
        frameClass
      )}
    >
      <div
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col bg-surface shadow-overlay",
          variant === "modal"
            ? "animate-[overlay-in_200ms_ease-out] rounded-panel"
            : "h-full max-h-none animate-[drawer-in_200ms_ease-out]",
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 whitespace-pre-line text-sm text-fg-secondary">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-muted hover:bg-background hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted px-5 py-3 [border-bottom-left-radius:inherit] [border-bottom-right-radius:inherit]">
            {footer}
          </footer>
        )}
      </div>
    </dialog>,
    document.body
  );
}

export type ModalProps = OverlayProps & { size?: "sm" | "md" | "lg" };

const MODAL_SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

export function Modal({ size = "md", ...props }: ModalProps) {
  return <Shell variant="modal" frameClass={MODAL_SIZES[size]} {...props} />;
}

/** Panneau latéral (filtres, menu, détail) — plein écran en largeur sur mobile */
export function Drawer(props: OverlayProps) {
  return <Shell variant="drawer" frameClass="" {...props} />;
}
