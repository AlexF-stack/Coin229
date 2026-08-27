"use client";

import { useRef } from "react";
import { Banknote, MapPinned, PackageCheck, Smartphone } from "lucide-react";
import { gsap, registerGsap, useGSAP } from "@/lib/gsap-client";

registerGsap();

const items = [
  {
    icon: PackageCheck,
    title: "En stock",
    text: "Disponible immédiatement",
  },
  {
    icon: MapPinned,
    title: "Livraison locale",
    text: "Cotonou, Porto-Novo, Godomey",
  },
  {
    icon: Smartphone,
    title: "Mobile Money",
    text: "MTN & Moov acceptés",
  },
  {
    icon: Banknote,
    title: "Paiement à la livraison",
    text: "Tu paies quand tu reçois",
  },
];

export function TrustStrip() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const items = el.querySelectorAll("[data-trust-item]");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(items, { clearProps: "all", opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        items,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.15,
        }
      );
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      aria-label="Avantages Coin229"
      className="border-b border-border bg-bg-elevated"
    >
      <ul className="page-shell grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-4 md:gap-6 md:px-6 md:py-5">
        {items.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            data-trust-item
            className="flex gap-2.5 opacity-0 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-amber" />
            <div>
              <p className="text-sm font-semibold text-navy">{title}</p>
              <p className="text-xs leading-snug text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
