"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isIosDevice,
  isPwaInstallBlocked,
  isPwaStandalone,
  markPwaInstalled,
  softDismissPwaPrompt,
} from "@/lib/pwa-install";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Variant = "banner" | "card" | "inline";

type Props = {
  /** banner = floating global ; card = confirmation/compte ; inline = compact */
  variant?: Variant;
  className?: string;
  /** Afficher même si soft-dismiss actif (ex. post-commande) */
  force?: boolean;
  title?: string;
  description?: string;
};

export function InstallAppCard({
  variant = "card",
  className,
  force = false,
  title = "Installer Coin229",
  description = "Retrouve ton panier et suis tes commandes en 1 tap — comme une vraie app.",
}: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const alone = isPwaStandalone();
    setStandalone(alone);
    setIos(isIosDevice());
    if (alone) {
      markPwaInstalled();
      return;
    }
    if (!force && isPwaInstallBlocked()) {
      setHidden(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, [force]);

  const dismiss = useCallback(() => {
    softDismissPwaPrompt();
    setHidden(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      markPwaInstalled();
      setHidden(true);
    } else {
      softDismissPwaPrompt();
      setHidden(true);
    }
  }, [deferred]);

  if (standalone || hidden) return null;
  // Android sans événement : on peut quand même montrer iOS-style tip sur Android rare — non, hide
  if (!deferred && !ios && variant === "banner") return null;

  const iosHint = ios && !deferred;

  if (variant === "banner") {
    return (
      <div
        role="dialog"
        aria-label="Installer Coin229"
        className={cn(
          "safe-pb fixed inset-x-0 bottom-20 z-[55] px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm",
          className
        )}
      >
        <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_16px_50px_rgba(15,45,38,0.15)]">
          <CardBody
            title={title}
            description={
              iosHint
                ? "Sur iPhone : Partager → Sur l’écran d’accueil."
                : description
            }
            iosHint={iosHint}
            deferred={Boolean(deferred)}
            onDismiss={dismiss}
            onInstall={() => void install()}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber/30 bg-cream/80 p-4 text-left",
        variant === "inline" && "p-3",
        className
      )}
    >
      <CardBody
        title={title}
        description={
          iosHint
            ? "Sur iPhone : touche Partager, puis « Sur l’écran d’accueil »."
            : description
        }
        iosHint={iosHint}
        deferred={Boolean(deferred)}
        onDismiss={force ? undefined : dismiss}
        onInstall={() => void install()}
        compact={variant === "inline"}
      />
    </div>
  );
}

function CardBody({
  title,
  description,
  iosHint,
  deferred,
  onDismiss,
  onInstall,
  compact,
}: {
  title: string;
  description: string;
  iosHint: boolean;
  deferred: boolean;
  onDismiss?: () => void;
  onInstall: () => void;
  compact?: boolean;
}) {
  return (
    <>
      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={compact ? 40 : 48}
          height={compact ? 40 : 48}
          className={cn(
            "shrink-0 rounded-xl object-cover",
            compact ? "h-10 w-10" : "h-12 w-12"
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          {iosHint ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-navy">
              <Share className="h-3.5 w-3.5 stroke-[1.5]" />
              Safari → Partager → Écran d’accueil
            </p>
          ) : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-muted hover:bg-white hover:text-navy"
            aria-label="Plus tard"
          >
            <X className="h-4 w-4 stroke-[1.5]" />
          </button>
        ) : null}
      </div>
      {deferred ? (
        <button
          type="button"
          onClick={onInstall}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-navy py-2.5 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4 stroke-[1.5]" />
          Installer l&apos;app
        </button>
      ) : null}
    </>
  );
}
