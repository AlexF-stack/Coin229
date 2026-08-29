import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Bandeau de conversion final — un message, un CTA (rythme landing). */
export function HomeClosingCta() {
  return (
    <section
      aria-labelledby="closing-cta-heading"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-navy"
    >
      <div className="page-shell px-5 py-14 text-center md:px-6 md:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber">
          Coin229
        </p>
        <h2
          id="closing-cta-heading"
          className="mx-auto mt-3 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl"
        >
          Prêt à trouver{" "}
          <span className="text-amber">votre pièce</span>&nbsp;?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
          Montres, bijoux, sacs et lunettes — recherchez, filtrez, commandez.
          Livraison locale et paiement flexible.
        </p>
        <Link
          href="/boutique"
          className="btn mt-8 inline-flex bg-amber text-navy hover:bg-amber-dark"
        >
          Explorer la boutique
          <ArrowRight className="h-4 w-4 stroke-[1.75]" />
        </Link>
      </div>
    </section>
  );
}
