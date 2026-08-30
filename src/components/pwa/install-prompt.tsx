"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import {
  consumePwaAfterOrderFlag,
  isPwaInstallBlocked,
  isPwaStandalone,
} from "@/lib/pwa-install";

/**
 * Bannière globale — retardée, soft-dismiss 7j, accélérée après commande.
 * Masquée sur /commande/confirmation (carte dédiée) et si déjà installé.
 */
export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [force, setForce] = useState(false);

  useEffect(() => {
    if (isPwaStandalone()) return;
    if (pathname?.startsWith("/commande/confirmation")) return;
    if (pathname?.startsWith("/admin")) return;

    const afterOrder = consumePwaAfterOrderFlag();
    if (afterOrder) {
      setForce(true);
      const t = window.setTimeout(() => setShow(true), 800);
      return () => window.clearTimeout(t);
    }

    if (isPwaInstallBlocked()) return;

    // 1ʳᵉ visite : attendre engagement (~8s), pas 2,5s
    const t = window.setTimeout(() => setShow(true), 8000);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return (
    <InstallAppCard
      variant="banner"
      force={force}
      title={force ? "Suis ta commande plus facilement" : "Installer Coin229"}
      description={
        force
          ? "Ajoute Coin229 sur ton écran d’accueil — panier, commandes et nouveautés en 1 tap."
          : "Panier sauvegardé, commandes sous la main, nouveautés plus vite."
      }
    />
  );
}
