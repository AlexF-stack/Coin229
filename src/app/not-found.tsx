import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-amber">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-sm text-muted">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-[16px] bg-amber px-5 py-3 text-sm font-semibold text-bg"
      >
        Retour à la boutique
      </Link>
    </div>
  );
}
