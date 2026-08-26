import { CheckCircle2, Package, Truck } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "1. Choisis",
    text: "Parcours le catalogue et ajoute au panier.",
  },
  {
    icon: CheckCircle2,
    title: "2. Commande",
    text: "Mobile Money ou paiement à la livraison.",
  },
  {
    icon: Truck,
    title: "3. Reçois",
    text: "Livraison dans ta zone, rapidement.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 md:px-0">
      <h2 className="font-display text-xl font-bold md:text-2xl">
        Comment ça marche
      </h2>
      <ol className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
        {steps.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="rounded-[16px] border border-border bg-card p-4 shadow-card"
          >
            <Icon className="h-5 w-5 stroke-[1.5] text-amber" />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
