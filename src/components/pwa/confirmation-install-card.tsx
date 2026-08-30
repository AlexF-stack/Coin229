"use client";

import { useEffect } from "react";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { flagPwaAfterOrder } from "@/lib/pwa-install";

/** Carte install sur confirmation — moment de valeur max. */
export function ConfirmationInstallCard() {
  useEffect(() => {
    flagPwaAfterOrder();
  }, []);

  return (
    <InstallAppCard
      variant="card"
      force
      className="mt-6 w-full text-left"
      title="Installe Coin229 pour suivre ta commande"
      description="Écran d’accueil → tes commandes, ton panier et les promos en un tap. Gratuit."
    />
  );
}
