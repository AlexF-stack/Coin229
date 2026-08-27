"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "coin229-cookie-consent";

export function CookieBanner() {
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

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Informations cookies"
      className="safe-pb fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-white/95 p-4 shadow-[0_-8px_30px_rgba(2,11,38,0.1)] backdrop-blur-md md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-2xl md:border"
    >
      <p className="text-sm text-navy">
        Nous utilisons des cookies techniques nécessaires au compte, au panier
        et à la sécurité. Pas de publicité tierce.{" "}
        <Link href="/cookies" className="font-medium text-amber underline">
          En savoir plus
        </Link>
      </p>
      <button
        type="button"
        onClick={accept}
        className="mt-3 w-full rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white md:w-auto"
      >
        Compris
      </button>
    </div>
  );
}
