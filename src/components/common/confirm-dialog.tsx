"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** null = simple information, un seul bouton */
  cancelLabel?: string | null;
  /** Action irréversible (annulation, suspension…) : bouton rouge */
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

/**
 * Remplace window.confirm / window.alert par une fenêtre du design system.
 *   const [confirm, dialog] = useConfirm();
 *   if (!(await confirm({ title: "Supprimer ?" }))) return;
 *   …et rendre {dialog} dans le composant.
 */
export function useConfirm() {
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

  const dialog = pending ? <ConfirmDialog options={pending} onClose={close} /> : null;
  return [confirm, dialog] as const;
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const { title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = false } = options;
  return (
    <Modal
      open
      size="sm"
      hideClose
      title={title}
      description={message}
      onClose={() => onClose(false)}
      footer={
        <>
          {cancelLabel !== null && (
            // Action dangereuse : le focus va sur « Annuler », Entrée ne valide pas par réflexe
            <Button variant="ghost" autoFocus={danger} onClick={() => onClose(false)}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={danger ? "destructive" : "primary"}
            autoFocus={!danger || cancelLabel === null}
            onClick={() => onClose(true)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
