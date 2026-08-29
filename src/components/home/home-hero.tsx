"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
};

export function HomeHero({ images }: Props) {
  const router = useRouter();
  const slides = (images.length ? images : ["/placeholder-product.svg"]).slice(
    0,
    3
  );
  const [index, setIndex] = useState(0);
  const [q, setQ] = useState("");
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

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      query ? `/boutique?q=${encodeURIComponent(query)}` : "/boutique"
    );
  }

  return (
    <section
      aria-label="Coin229 — accueil"
      className="relative min-h-[78dvh] w-full overflow-hidden bg-navy md:min-h-[85dvh]"
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
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Overlay lisibilité — léger, renforcé derrière le texte */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/35 to-navy/15"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-navy/55 via-navy/20 to-transparent md:from-navy/60 md:via-navy/25"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[78dvh] flex-col justify-end px-5 pb-12 pt-28 md:min-h-[85dvh] md:justify-center md:px-10 md:pb-20 md:pt-24 lg:px-16">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden />
            Bénin · Accessoires de mode
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-white">
            Les <span className="text-amber">détails</span> qui changent tout.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 md:text-lg">
            Montres, bijoux, sacs et accessoires sélectionnés pour votre style.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/boutique" className="btn btn-primary w-fit">
              Explorer la boutique
            </Link>
            <form onSubmit={onSearch} className="w-full max-w-xs">
              <label className="relative block">
                <span className="sr-only">Rechercher un produit</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un produit…"
                  className="w-full rounded-[10px] border border-white/25 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/55 focus:border-amber/60 focus:bg-white/15"
                />
              </label>
            </form>
          </div>
        </div>

        {slides.length > 1 && !reduceMotion ? (
          <div
            className="mt-8 flex gap-2 md:absolute md:bottom-10 md:right-10 md:mt-0"
            role="tablist"
            aria-label="Images du hero"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-8 bg-amber" : "w-1.5 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
