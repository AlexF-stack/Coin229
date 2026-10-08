"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
};

export function HomeHero({ images }: Props) {
  const slides = (images.length ? images : ["/placeholder-product.svg"]).slice(
    0,
    3
  );
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  return (
    <section
      aria-label="Coin229 — accueil"
      className="relative min-h-[82dvh] w-full overflow-hidden bg-primary md:min-h-[90dvh]"
    >
      {slides.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1400ms] ease-in-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={i !== index}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            className="object-cover object-center scale-[1.02]"
            sizes="100vw"
          />
        </div>
      ))}

      <div className="hero-scrim absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/45 to-primary/10 md:from-primary/85 md:via-primary/40 md:to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[82dvh] flex-col justify-end px-5 pb-14 pt-28 md:min-h-[90dvh] md:justify-center md:px-10 md:pb-24 md:pt-28 lg:px-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
            Accessoires de mode · Bénin
          </p>

          <h1 className="mt-5 font-display text-[clamp(3rem,9vw,5.5rem)] font-bold leading-[0.95] tracking-tight text-white">
            Coin229
            <span className="text-accent" aria-hidden>
              .
            </span>
          </h1>

          <p className="mt-4 max-w-lg font-display text-xl font-semibold leading-snug tracking-tight text-white md:text-2xl">
            Toute une tenue. Les bons détails.
          </p>

          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
            Montres, bijoux, sacs et lunettes — sélectionnés, livrés localement,
            payés à votre rythme.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/boutique" className="btn btn-accent w-fit">
              Explorer la boutique
            </Link>
            <Link
              href="/boutique?categorie=montre"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition hover:text-accent"
            >
              Voir les montres
              <ArrowRight className="h-4 w-4 stroke-[1.75]" aria-hidden />
            </Link>
          </div>
        </div>

        {slides.length > 1 ? (
          <div
            className="mt-10 flex items-center gap-3 md:absolute md:bottom-12 md:right-10 md:mt-0"
            role="tablist"
            aria-label="Images du hero"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${String(i + 1).padStart(2, "0")}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "font-display text-xs font-semibold tracking-[0.14em] transition",
                  i === index ? "text-accent" : "text-white/35 hover:text-white/70"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
