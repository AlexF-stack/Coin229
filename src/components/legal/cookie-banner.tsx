"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const KEY = "coin229-cookie-consent";

/** Espaces de gestion : le bandeau masquerait leur en-tête (navigation, déconnexion). */
const BACK_OFFICE = /^\/(admin|vendeur\/espace)(\/|$)/;

export function CookieBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "accepted");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible || BACK_OFFICE.test(pathname ?? "")) return null;

  // Mobile : fine barre en HAUT (ne masque plus les boutons d'achat en bas) ;
  // ordinateur : encart en bas à gauche.
  return (
    <div
      role="dialog"
      aria-label="Informations cookies"
      className="fixed inset-x-0 top-0 z-[60] flex items-center gap-3 border-b border-border bg-white/95 px-4 py-2.5 shadow-[0_8px_30px_rgba(2,11,38,0.08)] backdrop-blur-md md:inset-x-auto md:bottom-4 md:left-4 md:top-auto md:block md:max-w-md md:rounded-2xl md:border md:p-4"
    >
      <p className="min-w-0 flex-1 text-xs text-primary md:text-sm">
        <span className="md:hidden">Cookies techniques uniquement, pas de pub.</span>
        <span className="hidden md:inline">
          Nous utilisons des cookies techniques nécessaires au compte, au panier
          et à la sécurité. Pas de publicité tierce.
        </span>{" "}
        <Link href="/cookies" className="font-medium text-accent-ink underline">
          En savoir plus
        </Link>
      </p>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white md:mt-3 md:py-2.5 md:text-sm"
      >
        Compris
      </button>
    </div>
  );
}
