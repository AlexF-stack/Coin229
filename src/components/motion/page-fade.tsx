"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap, registerGsap } from "@/lib/gsap-client";

registerGsap();

/**
 * Transition légère entre pages.
 * Important : ne jamais laisser le contenu à opacity:0 (sinon pages « vides »
 * après navigation client si GSAP / ScrollTrigger rate).
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.opacity = "1";
    el.style.transform = "none";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const tween = gsap.fromTo(
      el,
      { opacity: 0.92, y: 6 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out", clearProps: "transform" }
    );

    return () => {
      tween.kill();
      el.style.opacity = "1";
      el.style.transform = "none";
    };
  }, [pathname]);

  return (
    <div ref={ref} className="min-h-[inherit]">
      {children}
    </div>
  );
}
