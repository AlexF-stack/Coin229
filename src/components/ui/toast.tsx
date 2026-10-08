"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; message: ReactNode };

const ToastContext = createContext<((message: ReactNode, tone?: ToastTone) => void) | null>(null);

const ICON: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />,
  error: <AlertCircle className="h-4 w-4 text-error" aria-hidden />,
  info: <Info className="h-4 w-4 text-info" aria-hidden />,
};

/** Monté une fois dans le layout racine */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (message: ReactNode, tone: ToastTone = "success") => {
      const id = Date.now() + Math.random();
      setItems((l) => [...l.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
    },
    [dismiss]
  );
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[80] flex flex-col items-center gap-2 md:inset-x-auto md:bottom-6 md:right-6 md:items-end"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-[overlay-in_200ms_ease-out] items-start gap-3 rounded-card border bg-surface px-4 py-3 text-sm text-fg shadow-raised",
              t.tone === "error" ? "border-error/30" : "border-border"
            )}
          >
            <span className="mt-0.5">{ICON[t.tone]}</span>
            <span className="min-w-0 flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Fermer"
              className="-m-1 rounded-badge p-1 text-muted hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Confirmation courte : const toast = useToast(); toast("Produit enregistré") */
export function useToast() {
  const ctx = useContext(ToastContext);
  // Sans provider (tests, Storybook) : sans effet plutôt qu'une erreur
  return ctx ?? (() => undefined);
}
