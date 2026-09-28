const blocks = [
  {
    n: "01",
    title: "Sélection",
    text: "Des accessoires choisis pour compléter votre style au quotidien.",
  },
  {
    n: "02",
    title: "Livraison locale",
    text: "Cotonou, Porto-Novo et Godomey — délais clairs avant paiement.",
  },
  {
    n: "03",
    title: "Paiement flexible",
    text: "Mobile Money ou paiement à la livraison selon les options.",
  },
  {
    n: "04",
    title: "Assistance",
    text: "Une équipe disponible pour vous accompagner sur WhatsApp.",
  },
] as const;

export function WhyCoin229() {
  return (
    <section aria-labelledby="why-heading" className="px-4 md:px-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber">
        Pourquoi Coin229
      </p>
      <h2
        id="why-heading"
        className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-navy md:text-4xl"
      >
        Une boutique. Un fil clair.
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted md:text-base">
        Du choix de la pièce jusqu’à la livraison — tout reste simple, local et
        lisible.
      </p>

      <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {blocks.map(({ n, title, text }) => (
          <li key={n} className="flex flex-col gap-3 border-t border-border pt-5">
            <span className="font-display text-xs font-semibold tracking-[0.16em] text-amber">
              {n}
            </span>
            <h3 className="font-display text-lg font-semibold text-navy">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
