import { Headphones, MapPinned, Sparkles, WalletCards } from "lucide-react";

const blocks = [
  {
    icon: Sparkles,
    title: "Sélection",
    text: "Des accessoires choisis pour compléter votre style quotidien.",
  },
  {
    icon: MapPinned,
    title: "Livraison locale",
    text: "Cotonou, Porto-Novo et Godomey — délais clairs avant paiement.",
  },
  {
    icon: WalletCards,
    title: "Paiement flexible",
    text: "Mobile Money ou paiement à la livraison selon les options.",
  },
  {
    icon: Headphones,
    title: "Assistance",
    text: "Une équipe disponible pour vous accompagner sur WhatsApp.",
  },
] as const;

export function WhyCoin229() {
  return (
    <section aria-labelledby="why-heading" className="px-4 md:px-0">
      <h2
        id="why-heading"
        className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl"
      >
        Pourquoi Coin229&nbsp;?
      </h2>

      <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {blocks.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber/15 text-amber">
              <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
            </span>
            <h3 className="font-display text-lg font-semibold text-navy">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
