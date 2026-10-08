"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, MessageCircle, RotateCcw } from "lucide-react";
import { whatsappHref } from "@/lib/site";

/** Erreur inattendue dans une page : écran lisible au lieu de l'erreur brute */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const ref = error.digest ? ` (réf. ${error.digest})` : "";

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      {/* Avec le streaming (loading.tsx) le statut HTTP reste 200 :
          on empêche l'indexation d'un écran d'erreur temporaire */}
      <meta name="robots" content="noindex" />
      <AlertTriangle className="h-12 w-12 stroke-[1.25] text-error" />
      <h1 className="mt-4 font-display text-2xl font-bold text-primary md:text-3xl">
        Oups, un souci technique
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Cette page n’a pas pu s’afficher. Réessaie dans un instant ; si le
        problème continue, écris-nous sur WhatsApp.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RotateCcw className="h-4 w-4 stroke-[1.5]" />
          Réessayer
        </button>
        <Link href="/boutique" className="btn btn-secondary">
          Voir la boutique
        </Link>
      </div>
      <a
        href={whatsappHref(`Bonjour Coin229, une page du site affiche une erreur${ref}.`)}
        target="_blank"
        rel="noreferrer"
        className="btn btn-ghost mt-3 text-sm"
      >
        <MessageCircle className="h-4 w-4 stroke-[1.5] text-whatsapp" />
        Prévenir sur WhatsApp
      </a>
      {error.digest && (
        <p className="mt-4 text-xs text-muted">Référence : {error.digest}</p>
      )}
    </div>
  );
}
