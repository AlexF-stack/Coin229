import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { getOrderForConfirmation } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ConfirmationPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <XCircle className="h-16 w-16 stroke-[1.25] text-coral" />
        <h1 className="mt-4 font-display text-2xl font-bold">
          Commande introuvable
        </h1>
        <Link
          href="/"
          className="mt-8 rounded-[16px] bg-amber px-6 py-3.5 font-semibold text-navy"
        >
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
        <h1 className="mt-4 font-display text-2xl font-bold">
          Commande introuvable
        </h1>
        <p className="mt-2 text-sm text-muted">
          Vérifie le lien ou contacte-nous sur WhatsApp.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-[16px] bg-amber px-6 py-3.5 font-semibold text-navy"
        >
          Retour boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <CheckCircle2 className="h-16 w-16 stroke-[1.25] text-green" />
      <h1 className="mt-4 font-display text-2xl font-bold">
        Commande confirmée
      </h1>
      <p className="mt-2 text-sm text-muted">
        Merci ! Notre équipe te contacte bientôt pour la livraison.
      </p>
      <p className="mt-3 rounded-[20px] bg-card px-3 py-1.5 text-xs text-muted">
        Réf. {id}
      </p>
      {order && (
        <div className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card p-4 text-left text-sm">
          <p className="font-semibold text-amber">
            {formatPrice(order.montantTotal)}
          </p>
          <ul className="mt-2 space-y-1 text-muted">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantite}× {item.product.nom}
              </li>
            ))}
          </ul>
        </div>
      )}
      {demo && (
        <p className="mt-3 text-xs text-muted">
          Mode local / démo — aucune écriture base de données.
        </p>
      )}
      <div className="mt-8 flex w-full flex-col gap-3">
        <Link
          href="/"
          className="rounded-[16px] bg-amber py-3.5 font-semibold text-navy"
        >
          Continuer le shopping
        </Link>
        <Link
          href="/compte"
          className="rounded-[16px] bg-card py-3.5 text-sm font-medium text-fg"
        >
          Voir mes commandes
        </Link>
      </div>
    </div>
  );
}
