import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  image?: string;
};

export function EditorialBlock({ image }: Props) {
  return (
    <section
      aria-labelledby="editorial-heading"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-cream"
    >
      <div className="page-shell grid items-center gap-10 px-5 py-14 md:grid-cols-2 md:gap-14 md:px-6 md:py-20">
        {image ? (
          <div className="relative order-2 aspect-[4/5] overflow-hidden bg-navy md:order-1 md:aspect-[5/6] md:rounded-none">
            <Image
              src={image}
              alt="Détails Coin229"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="order-2 aspect-[4/5] bg-navy md:order-1 md:aspect-[5/6]"
            aria-hidden
          />
        )}

        <div className="order-1 md:order-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber">
            Le détail qui compte
          </p>
          <h2
            id="editorial-heading"
            className="mt-3 max-w-md font-display text-3xl font-bold leading-[1.05] tracking-tight text-navy md:text-5xl"
          >
            Les détails qui changent tout
            <span className="text-amber" aria-hidden>
              .
            </span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Une montre. Une chaîne. Un sac. Les bons détails peuvent transformer
            une tenue — et on les livre chez vous.
          </p>

          <ol className="mt-8 space-y-3 text-sm text-navy">
            {[
              ["01", "Choisir la pièce"],
              ["02", "Commander en quelques taps"],
              ["03", "Recevoir localement"],
            ].map(([n, label]) => (
              <li key={n} className="flex items-center gap-3">
                <span className="font-display text-xs font-semibold tracking-[0.14em] text-amber">
                  {n}
                </span>
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ol>

          <Link
            href="/boutique"
            className="btn btn-primary mt-9 inline-flex items-center gap-2"
          >
            Découvrir
            <ArrowRight className="h-4 w-4 stroke-[1.75]" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
