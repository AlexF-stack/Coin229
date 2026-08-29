import Image from "next/image";
import Link from "next/link";

type Props = {
  image?: string;
};

export function EditorialBlock({ image }: Props) {
  return (
    <section
      aria-labelledby="editorial-heading"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-cream"
    >
      <div className="page-shell grid items-center gap-8 px-5 py-12 md:grid-cols-2 md:gap-12 md:px-6 md:py-16">
        {image ? (
          <div className="relative order-2 aspect-[4/5] overflow-hidden rounded-xl bg-navy md:order-1 md:aspect-[5/6]">
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
            className="order-2 aspect-[4/5] rounded-xl bg-navy md:order-1 md:aspect-[5/6]"
            aria-hidden
          />
        )}

        <div className="order-1 md:order-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
            Coin229
          </p>
          <h2
            id="editorial-heading"
            className="mt-3 max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl"
          >
            Les détails qui changent tout.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            Une montre.
            <br />
            Une chaîne.
            <br />
            Un sac.
            <br />
            Les bons détails peuvent transformer une tenue.
          </p>
          <Link href="/boutique" className="btn btn-primary mt-8">
            Découvrir
          </Link>
        </div>
      </div>
    </section>
  );
}
