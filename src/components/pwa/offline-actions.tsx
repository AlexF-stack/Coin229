"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/site";

export function OfflineActions() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    // Si on revient en ligne sur /offline, tenter le retour
    const from = sessionStorage.getItem("coin229-offline-from");
    if (from && from !== "/offline") {
      sessionStorage.removeItem("coin229-offline-from");
      window.location.href = from;
    }
  }, [online]);

  function retry() {
    if (navigator.onLine) {
      window.location.href = "/";
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
      <button type="button" onClick={retry} className="btn btn-primary w-full">
        {online ? "Revenir à l’accueil" : "Réessayer"}
      </button>
      <Link href="/boutique" className="btn btn-secondary w-full">
        Boutique (si en cache)
      </Link>
      <Link href="/panier" className="btn btn-ghost w-full text-sm">
        Voir mon panier
      </Link>
      <p className="text-center text-xs text-muted">
        {online
          ? "Connexion rétablie."
          : `${SITE.name} · mode hors ligne`}
      </p>
    </div>
  );
}
