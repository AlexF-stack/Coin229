"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "coin229-pwa-dismiss";

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    setStandalone(isStandalone);
    if (isStandalone) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // ignore
    }

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIos(ios);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), 2500);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    if (ios) {
      window.setTimeout(() => setVisible(true), 3500);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (choice.outcome === "accepted") {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        // ignore
      }
    }
  }

  if (standalone || !visible) return null;
  if (!deferred && !isIos) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer Coin229"
      className="safe-pb fixed inset-x-0 bottom-20 z-[55] px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
    >
      <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_16px_50px_rgba(2,11,38,0.15)]">
        <div className="flex items-start gap-3">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-navy">Installer Coin229</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {isIos && !deferred
                ? "Sur iPhone : Partager → Sur l’écran d’accueil."
                : "Ajoute l’app sur ton téléphone pour commander plus vite."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full p-1 text-muted hover:bg-surface hover:text-navy"
            aria-label="Fermer"
          >
            <X className="h-4 w-4 stroke-[1.5]" />
          </button>
        </div>
        {deferred && (
          <button
            type="button"
            onClick={install}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-amber py-2.5 text-sm font-semibold text-navy"
          >
            <Download className="h-4 w-4 stroke-[1.5]" />
            Télécharger l&apos;app
          </button>
        )}
      </div>
    </div>
  );
}
