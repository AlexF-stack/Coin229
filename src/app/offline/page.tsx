import type { Metadata } from "next";
import { OfflineActions } from "@/components/pwa/offline-actions";

export const metadata: Metadata = {
  title: "Hors ligne",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-4xl font-bold text-navy">
        Coin<span className="text-amber">229</span>
      </p>
      <h1 className="mt-6 font-display text-2xl font-bold text-navy">
        Tu es hors ligne
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Vérifie ta connexion mobile. Les pages déjà ouvertes (accueil, boutique,
        panier) restent utilisables grâce au mode hors ligne.
      </p>
      <OfflineActions />
    </div>
  );
}
