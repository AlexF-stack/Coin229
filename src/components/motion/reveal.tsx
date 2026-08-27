"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { gsap, registerGsap, useGSAP } from "@/lib/gsap-client";

registerGsap();

type RevealProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className,
  y = 28,
  delay = 0,
  duration = 0.75,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { clearProps: "all", opacity: 1 });
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: once
              ? "play none none none"
              : "play reverse play reverse",
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  itemSelector?: string;
  y?: number;
  stagger?: number;
};

export function StaggerReveal({
  children,
  className,
  itemSelector = "[data-reveal-item]",
  y = 36,
  stagger = 0.07,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const items = root.querySelectorAll(itemSelector);
      if (!items.length) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(items, { clearProps: "all", opacity: 1 });
        return;
      }

      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: ref, dependencies: [children] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
