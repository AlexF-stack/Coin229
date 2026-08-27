import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

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
      <p className="mt-3 max-w-sm text-sm text-muted">
        Vérifie ta connexion pour parcourir la boutique. Les pages déjà visitées
        peuvent rester accessibles.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-white"
      >
        Réessayer
      </Link>
      <p className="mt-6 text-xs text-muted">{SITE.name} · PWA</p>
    </div>
  );
}
