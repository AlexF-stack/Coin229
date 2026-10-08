import Link from "next/link";
import { ArrowRight, Megaphone, Store, Wallet } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

const POINTS = [
  { icon: Store, text: "Ta vitrine sur Coin229, tes produits dans la boutique" },
  { icon: Megaphone, text: "Liens à partager sur WhatsApp, TikTok, Facebook" },
  { icon: Wallet, text: "Commandes et reversements suivis dans ton espace" },
];

/** Appel à devenir vendeur (accueil) — renvoie vers la création de compte vendeur */
export function SellOnCoin229() {
  return (
    <section
      aria-labelledby="devenir-vendeur"
      className="mx-4 overflow-hidden rounded-panel bg-surface-inverse px-6 py-8 text-inverse shadow-card md:mx-0 md:px-10 md:py-10"
    >
      <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Marques & créateurs</p>
          <h2 id="devenir-vendeur" className="mt-2 font-display text-2xl font-semibold tracking-tight text-inverse md:text-3xl">
            Tu as une marque ? Vends sur Coin229.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-inverse/75 md:text-base">
            Crée ton compte vendeur en quelques minutes. Après validation par l’équipe Coin229, tes produits
            apparaissent dans la boutique.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/vendeur/inscription" className={buttonClasses({ variant: "accent", size: "lg" })}>
              Devenir vendeur
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/compte" className="text-sm font-medium text-inverse/80 underline-offset-4 hover:text-inverse hover:underline">
              J’ai déjà un compte
            </Link>
          </div>
        </div>
        <ul className="space-y-3">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-card bg-white/5 px-4 py-3 text-sm text-inverse/85">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.75] text-accent" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
