import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-amber">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Ce lien n&apos;existe pas ou le produit a été retiré. Retourne à la
        boutique Coin229.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-white"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
