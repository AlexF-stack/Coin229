"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { gsap, registerGsap, useGSAP } from "@/lib/gsap-client";

registerGsap();

export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    },
    { dependencies: [pathname], scope: ref, revertOnUpdate: true }
  );

  return (
    <div ref={ref} className="min-h-[inherit]">
      {children}
    </div>
  );
}
