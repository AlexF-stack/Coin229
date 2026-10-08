"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** null = simple information, un seul bouton */
  cancelLabel?: string | null;
  /** Action irréversible (annulation, suspension…) : bouton rouge */
  danger?: boolean;
};

type Theme = "dark" | "light";

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * Remplace window.confirm / window.alert par une vraie fenêtre (<dialog> natif :
 * focus piégé, Échap, fond assombri).
 *   const [confirm, dialog] = useConfirm("dark");
 *   if (!(await confirm({ title: "Supprimer ?" }))) return;
 *   …et rendre {dialog} dans le composant.
 */
export function useConfirm(theme: Theme = "light") {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
      }),
    []
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending]
  );

  // Portail : la fenêtre ne doit pas se retrouver dans un <a> ou un <ul>
  const dialog = pending
    ? createPortal(<ConfirmDialog options={pending} theme={theme} onClose={close} />, document.body)
    : null;

  return [confirm, dialog] as const;
}

function ConfirmDialog({
  options,
  theme,
  onClose,
}: {
  options: ConfirmOptions;
  theme: Theme;
  onClose: (ok: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const {
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    danger = false,
  } = options;
  const dark = theme === "dark";

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
      // Clic sur le fond (hors du contenu) = Annuler. stopPropagation : le
      // composant appelant peut être dans un <Link> (carte produit).
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose(false);
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        dark ? "border border-white/10 bg-[#161920] text-[#e8eaed]" : "border border-border bg-white text-navy"
      )}
    >
      <div className="p-5">
        <h2
          id="confirm-dialog-title"
          className={cn("text-base font-semibold", dark ? "text-white" : "text-navy")}
        >
          {title}
        </h2>
        {message && (
          <p className={cn("mt-2 whitespace-pre-line text-sm", dark ? "text-white/65" : "text-muted")}>
            {message}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {cancelLabel !== null && (
            <button
              type="button"
              // Action dangereuse : Entrée ne doit pas la valider par réflexe
              autoFocus={danger}
              onClick={() => onClose(false)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                dark ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-navy hover:bg-navy/5"
              )}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus={!danger || cancelLabel === null}
            onClick={() => onClose(true)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold",
              danger
                ? "bg-red-600 text-white hover:bg-red-500"
                : dark
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-navy text-white hover:bg-navy/90"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
