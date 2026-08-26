import Link from "next/link";

export const metadata = {
  title: "À propos",
};

export default function AboutPage() {
  return (
    <div className="space-y-8 px-4 py-6 md:px-0 md:py-10">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-amber">
          Coin229
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          Accessoires mode pour le Bénin
        </h1>
        <p className="mt-3 text-muted leading-relaxed">
          Coin229 propose montres, bijoux et sacs pour hommes et femmes.
          Sélection soignée, livraison sur Cotonou, Porto-Novo et Godomey /
          Abomey-Calavi.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Qualité",
            text: "Des pièces choisies pour le style du quotidien et les sorties.",
          },
          {
            title: "Livraison",
            text: "Zones claires, frais affichés avant paiement.",
          },
          {
            title: "Paiement simple",
            text: "Mobile Money ou paiement à la livraison.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[16px] border border-border bg-card p-5 shadow-card"
          >
            <h2 className="font-display text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="inline-flex rounded-[16px] bg-amber px-5 py-3 text-sm font-semibold text-bg"
      >
        Voir la boutique
      </Link>
    </div>
  );
}
