import Link from "next/link";

/** Puces filtres rapides — pas de doublon catégories (voir CategoryShowcase). */
const chips = [
  { label: "Nouveautés", href: "/boutique?sort=nouveautes" },
  { label: "En stock", href: "/boutique?enStock=1" },
] as const;
export function BenefitChips() {
  return (
    <section aria-label="Accès rapide" className="px-4 md:px-0">
      <ul className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-0.5 md:mx-0 md:flex-wrap md:justify-start md:overflow-visible md:px-0 md:pb-0">
        {chips.map((chip) => (
          <li key={chip.href} className="shrink-0">
            <Link
              href={chip.href}
              className="inline-flex h-8 items-center rounded-full border border-border bg-white px-3 text-xs font-medium text-navy transition hover:border-navy hover:bg-cream md:h-9 md:px-3.5 md:text-sm"
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
