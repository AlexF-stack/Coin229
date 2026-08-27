"use client";

import { useRef } from "react";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { gsap, registerGsap, useGSAP } from "@/lib/gsap-client";

registerGsap();

const steps = [
  {
    icon: Package,
    title: "1. Choisis",
    text: "Parcours montres, bijoux, sacs et lunettes — prix en FCFA.",
  },
  {
    icon: CheckCircle2,
    title: "2. Commande",
    text: "Mobile Money ou paiement à la livraison, selon ton choix.",
  },
  {
    icon: Truck,
    title: "3. Reçois",
    text: "Livraison Cotonou, Porto-Novo ou Godomey — suivi WhatsApp.",
  },
];

export function HowItWorks() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const heading = el.querySelector("[data-how-heading]");
      const items = el.querySelectorAll("[data-how-item]");
      const line = el.querySelector("[data-how-line]");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([heading, items], { clearProps: "all", opacity: 1, y: 0 });
        if (line) gsap.set(line, { clearProps: "transform", scaleX: 1 });
        return;
      }

      gsap.fromTo(
        heading,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );

      if (line) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.9,
            ease: "power2.inOut",
            scrollTrigger: { trigger: el, start: "top 80%" },
          }
        );
      }

      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 78%" },
        }
      );
    },
    { scope: root }
  );

  return (
    <section ref={root} className="px-4 md:px-0">
      <h2
        data-how-heading
        className="font-display text-xl font-bold text-navy opacity-0 md:text-2xl"
      >
        Comment ça marche
      </h2>
      <div
        data-how-line
        className="mt-5 origin-left border-t border-border"
        style={{ transform: "scaleX(0)" }}
      />
      <ol className="mt-6 grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            data-how-item
            className="group flex gap-3 opacity-0 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber transition-colors group-hover:bg-amber group-hover:text-navy">
              <Icon className="h-5 w-5 stroke-[1.5]" />
            </span>
            <div>
              <p className="font-semibold text-navy">{title}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
