import Link from "next/link";
import { Sparkles } from "lucide-react";

export function PromoBanner() {
  return (
    <>
      {/* Mobile */}
      <section className="gradient-promo relative mx-4 overflow-hidden rounded-[20px] p-5 text-white md:hidden">
        <div className="relative z-10 max-w-[70%]">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80">
            <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
            Nouveau drop
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight">
            Coin229
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Accessoires qui claquent — stock local, livré chez toi aujourd&apos;hui.
          </p>
          <Link
            href="/?categorie=montre"
            className="mt-4 inline-flex rounded-[20px] bg-bg/90 px-4 py-2 text-sm font-semibold text-fg backdrop-blur-sm transition active:scale-95"
          >
            Voir les montres
          </Link>
        </div>
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/20 blur-2xl"
          aria-hidden
        />
      </section>

      {/* Desktop */}
      <section className="relative mx-0 hidden overflow-hidden rounded-[24px] gradient-hero-desktop text-white md:block">
        <div className="relative z-10 grid min-h-[280px] grid-cols-2 items-center gap-8 px-10 py-12 lg:min-h-[340px] lg:px-14">
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-amber">
              <Sparkles className="h-4 w-4 stroke-[1.5]" />
              Bénin · Mode premium
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight lg:text-5xl">
              Style qui se voit.
              <br />
              Stock qui part vite.
            </h2>
            <p className="mt-4 max-w-md text-base text-white/85">
              Montres, bijoux et sacs. Livraison Cotonou, Porto-Novo et Godomey.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/?categorie=montre"
                className="rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-amber-dark"
              >
                Explorer les montres
              </Link>
              <Link
                href="/livraison"
                className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20"
              >
                Zones & frais
              </Link>
            </div>
          </div>
          <div className="relative hidden h-full min-h-[220px] lg:block">
            <div className="absolute inset-4 rounded-[20px] bg-white/10 backdrop-blur-sm" />
            <div className="absolute -right-4 top-8 h-40 w-40 rounded-full bg-coral/40 blur-3xl" />
            <div className="absolute bottom-4 left-8 h-32 w-32 rounded-full bg-amber/50 blur-3xl" />
          </div>
        </div>
      </section>
    </>
  );
}
