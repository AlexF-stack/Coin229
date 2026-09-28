import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Bandeau de conversion final — un message, un CTA. */
export function HomeClosingCta() {
  return (
    <section
      aria-labelledby="closing-cta-heading"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-navy"
    >
      <div className="page-shell px-5 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber">
            Coin229
          </p>
          <h2
            id="closing-cta-heading"
            className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl"
          >
            Voyons votre prochaine pièce
            <span className="text-amber" aria-hidden>
              .
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
            Montres, bijoux, sacs et lunettes. Recherchez, filtrez, commandez —
            livraison locale et paiement flexible.
          </p>
          <Link
            href="/boutique"
            className="btn btn-accent mt-9 inline-flex items-center gap-2"
          >
            Explorer la boutique
            <ArrowRight className="h-4 w-4 stroke-[1.75]" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
