"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, registerGsap, useGSAP } from "@/lib/gsap-client";

registerGsap();

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const media = el.querySelector("[data-hero-media]");
      const line = el.querySelector("[data-hero-line]");
      const title = el.querySelector("[data-hero-title]");
      const copy = el.querySelector("[data-hero-copy]");
      const ctas = el.querySelectorAll("[data-hero-cta]");
      const scrollHint = el.querySelector("[data-hero-scroll]");

      if (reduce) {
        gsap.set([line, title, copy, ctas, scrollHint], { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (media) {
        gsap.fromTo(
          media,
          { scale: 1.12 },
          { scale: 1, duration: 2.2, ease: "power2.out" }
        );
      }

      tl.fromTo(
        line,
        { opacity: 0, y: 18, letterSpacing: "0.5em" },
        { opacity: 1, y: 0, letterSpacing: "0.28em", duration: 0.8 },
        0.15
      )
        .fromTo(
          title,
          { opacity: 0, y: 40, clipPath: "inset(0 0 100% 0)" },
          { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.95 },
          0.28
        )
        .fromTo(
          copy,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.7 },
          0.5
        )
        .fromTo(
          ctas,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
          0.62
        )
        .fromTo(
          scrollHint,
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          0.9
        );

      if (scrollHint) {
        gsap.to(scrollHint, {
          y: 8,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.2,
        });
      }
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative isolate min-h-[78dvh] w-full overflow-hidden md:min-h-[72dvh]"
    >
      <div data-hero-media className="absolute inset-0 will-change-transform">
        <Image
          src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&q=80"
          alt="Lunettes et accessoires Coin229"
          fill
          priority
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
      </div>
      <div className="hero-scrim absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 80%, rgba(201,162,39,0.28), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[78dvh] flex-col justify-end px-5 pb-14 pt-24 md:min-h-[72dvh] md:px-0 md:pb-20 md:pt-28">
        <div className="page-shell md:px-0">
          <p
            data-hero-line
            className="text-xs font-medium uppercase tracking-[0.28em] text-amber opacity-0"
          >
            Cotonou · Accessoires
          </p>
          <h1
            data-hero-title
            className="mt-3 font-display text-[clamp(3rem,11vw,5.75rem)] font-bold leading-[0.92] tracking-tight text-white opacity-0"
          >
            Coin<span className="text-amber">229</span>
          </h1>
          <p
            data-hero-copy
            className="mt-4 max-w-md text-base text-white/85 opacity-0 md:text-lg"
          >
            Montres, bijoux, sacs & lunettes — prix en FCFA, livrés à Cotonou,
            Porto-Novo et Godomey.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              data-hero-cta
              href="#catalogue"
              className="btn-press rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-navy shadow-[0_8px_24px_rgba(201,162,39,0.4)] transition hover:bg-amber-dark opacity-0"
            >
              Voir la sélection
            </Link>
            <Link
              data-hero-cta
              href="/?categorie=lunette"
              className="btn-press rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white hover:bg-white/15 opacity-0"
            >
              Lunettes
            </Link>
          </div>
        </div>

        <div
          data-hero-scroll
          className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 opacity-0 md:bottom-8"
          aria-hidden
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/55">
            Scroll
          </span>
          <span className="h-8 w-px bg-gradient-to-b from-white/70 to-transparent" />
        </div>
      </div>
    </section>
  );
}
