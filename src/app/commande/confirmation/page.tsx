import Link from "next/link";
import { CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import { getOrderForConfirmation } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { SITE, whatsappHref } from "@/lib/site";
import { ConfirmationInstallCard } from "@/components/pwa/confirmation-install-card";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ConfirmationPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <XCircle className="h-16 w-16 stroke-[1.25] text-coral" />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">
          Commande introuvable
        </h1>
        <Link href="/boutique" className="btn btn-primary mt-8">
          Retour boutique
        </Link>
      </div>
    );
  }

  const { demo, order } = await getOrderForConfirmation(id);

  if (!demo && !order) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <XCircle className="h-16 w-16 stroke-[1.25] text-coral" />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">
          Commande introuvable
        </h1>
        <p className="mt-2 text-sm text-muted">
          Vérifiez le lien ou contactez-nous sur WhatsApp.
        </p>
        <Link href="/boutique" className="btn btn-primary mt-8">
          Retour boutique
        </Link>
      </div>
    );
  }

  const waHelp = whatsappHref(
    id
      ? `Bonjour Coin229, j'ai besoin d'aide concernant ma commande ${id}.`
      : "Bonjour Coin229, j'ai une question sur ma commande."
  );

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <CheckCircle2 className="h-16 w-16 stroke-[1.25] text-green" />
      <h1 className="mt-4 font-display text-2xl font-bold text-navy md:text-3xl">
        Commande confirmée&nbsp;!
      </h1>
      <p className="mt-2 text-sm text-muted">
        Merci. Notre équipe vous contacte bientôt pour la livraison.
      </p>

      <p className="mt-4 rounded-full bg-cream px-4 py-1.5 text-xs font-medium text-navy">
        N° {id}
      </p>

      {order && (
        <div className="mt-6 w-full rounded-[12px] bg-cream p-5 text-left text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted">Total</span>
            <span className="font-display text-lg font-semibold text-navy">
              {formatPrice(order.montantTotal)}
            </span>
          </div>
          {order.items.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3 text-muted">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.quantite}× {item.product.nom}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {demo && (
        <p className="mt-3 text-xs text-muted">
          Mode local / démo — aucune écriture base de données.
        </p>
      )}

      <div className="mt-8 flex w-full flex-col gap-3">
        <Link href="/compte" className="btn btn-primary w-full">
          Suivre ma commande
        </Link>
        <Link href="/boutique" className="btn btn-secondary w-full">
          Continuer mes achats
        </Link>
        <a
          href={waHelp}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost w-full text-sm"
        >
          <MessageCircle className="h-4 w-4 stroke-[1.5] text-[#25D366]" />
          Besoin d&apos;aide ? WhatsApp
        </a>
      </div>

      <ConfirmationInstallCard />

      <p className="mt-6 text-xs text-muted">
        {SITE.name} · {SITE.zones.join(", ")}
      </p>
    </div>
  );
}
