import Link from "next/link";

/** Puces bénéfices compactes — grille claire type landing, sans cards. */
const chips = [
  { label: "Montres", href: "/boutique?categorie=montre" },
  { label: "Bijoux", href: "/boutique?categorie=bijou" },
  { label: "Sacs", href: "/boutique?categorie=sac" },
  { label: "Lunettes", href: "/boutique?categorie=lunette" },
  { label: "Nouveautés", href: "/boutique?sort=nouveautes" },
  { label: "En stock", href: "/boutique?enStock=1" },
] as const;

export function BenefitChips() {
  return (
    <section aria-label="Accès rapide" className="px-4 md:px-0">
      <ul className="flex flex-wrap justify-center gap-2 md:justify-start md:gap-2.5">
        {chips.map((chip) => (
          <li key={chip.href}>
            <Link
              href={chip.href}
              className="inline-flex rounded-[10px] border border-border bg-white px-3.5 py-2 text-sm font-medium text-navy transition hover:border-navy hover:bg-cream"
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
