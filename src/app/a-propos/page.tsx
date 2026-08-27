import type { Metadata } from "next";
import Link from "next/link";
import { SITE, whatsappHref } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "À propos",
  description: `${SITE.name} — boutique d'accessoires mode au Bénin. Montres, bijoux, sacs et lunettes livrés à Cotonou, Porto-Novo et Godomey.`,
  path: "/a-propos",
});

export default function AboutPage() {
  return (
    <div className="space-y-8 px-4 py-6 md:px-0 md:py-10">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-amber">
          {SITE.name}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-navy">
          Accessoires mode pour le Bénin
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          {SITE.name} est une boutique en ligne basée à Cotonou. Nous sélectionnons
          montres, bijoux, sacs et lunettes pour un look net au quotidien —
          livrés chez toi à {SITE.zones.join(", ")}.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Sélection utile",
            text: "Des pièces photo-ready, pensées pour le soleil, les sorties et le rythme urbain béninois.",
          },
          {
            title: "Livraison claire",
            text: "Zones, délais et frais affichés avant paiement. Tu sais exactement ce que tu paies en FCFA.",
          },
          {
            title: "Paiement de confiance",
            text: "Paiement à la livraison ou Mobile Money (MTN MoMo / Moov). Service client WhatsApp.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="border-t border-border pt-4 md:border md:rounded-xl md:border-border md:p-5"
          >
            <h2 className="font-display text-lg font-semibold text-navy">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </div>

      <section className="max-w-2xl space-y-2 text-sm text-muted">
        <h2 className="font-display text-lg font-semibold text-navy">Contact</h2>
        <p>
          {SITE.legalName} · {SITE.address}
        </p>
        <p>
          <a href={`mailto:${SITE.email}`} className="text-amber">
            {SITE.email}
          </a>{" "}
          ·{" "}
          <a href={whatsappHref()} className="text-amber" target="_blank" rel="noreferrer">
            WhatsApp {SITE.phoneDisplay}
          </a>
        </p>
        <p>
          <Link href="/mentions-legales" className="text-amber">
            Mentions légales
          </Link>
          {" · "}
          <Link href="/cgv" className="text-amber">
            CGV
          </Link>
          {" · "}
          <Link href="/confidentialite" className="text-amber">
            Confidentialité
          </Link>
        </p>
      </section>

      <Link
        href="/"
        className="inline-flex rounded-full bg-amber px-5 py-3 text-sm font-semibold text-white"
      >
        Voir la boutique
      </Link>
    </div>
  );
}
