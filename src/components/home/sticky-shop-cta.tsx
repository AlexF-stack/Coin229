"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * CTA sticky mobile inspiré des landing conversion (ex. sticky offre).
 * Apparaît après le hero, au-dessus de la bottom-nav.
 */
export function StickyShopCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="safe-pb pointer-events-none fixed inset-x-0 bottom-[4.25rem] z-40 px-3 md:hidden">
      <Link
        href="/boutique"
        className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-[12px] bg-navy py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(15,45,38,0.28)]"
      >
        Explorer la boutique
        <ArrowRight className="h-4 w-4 stroke-[1.75]" />
      </Link>
    </div>
  );
}
