import { Banknote, MapPinned, PackageCheck, Smartphone } from "lucide-react";

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
  return (
    <section
      aria-label="Avantages Coin229"
      className="border-y border-border bg-bg-elevated"
    >
      <ul className="page-shell grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-4 md:gap-6 md:px-6 md:py-5">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-2.5">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-amber" />
            <div>
              <p className="text-sm font-semibold text-fg">{title}</p>
              <p className="text-xs leading-snug text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
