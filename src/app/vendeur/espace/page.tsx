import Link from "next/link";
import { VendorShell } from "@/components/vendeur/vendor-shell";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorStats } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingCart, Megaphone, ArrowRight } from "lucide-react";

export const metadata = { title: "Espace vendeur" };
export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const session = await requireVendorPage();

  const [stats, unreadMessages] = await Promise.all([
    getMyVendorStats(),
    getVendorUnreadTotal(),
  ]);

  const nextStep =
    session.statut === "en_attente"
      ? {
          title: "En attente de validation Coin229",
          body: "Tu peux déjà préparer tes produits. La vitrine publique s’ouvrira dès activation.",
          href: "/vendeur/espace/produits",
          cta: "Préparer mes produits",
        }
      : stats.enAttente > 0
        ? {
            title: `${stats.enAttente} commande(s) à traiter`,
            body: "Confirme, prépare l’envoi, puis passe en livraison.",
            href: "/vendeur/espace/commandes",
            cta: "Voir les commandes",
          }
        : stats.productCount === 0
          ? {
              title: "Ajoute ton premier produit",
              body: "Photo, nom, prix, niche — quelques secondes pour apparaître en boutique.",
              href: "/vendeur/espace/produits",
              cta: "Ajouter un produit",
            }
          : {
              title: "Tout est à jour",
              body: "Partage ta vitrine WhatsApp / TikTok pour faire venir des clients.",
              href: "/vendeur/espace/pub",
              cta: "Copier mes liens pub",
            };

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {session.nomBoutique}
            {session.statut === "en_attente" &&
              " — en attente de validation Coin229"}
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">
            Prochaine étape
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            {nextStep.title}
          </p>
          <p className="mt-1 text-sm text-white/55">{nextStep.body}</p>
          <Link
            href={nextStep.href}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#0c0d12] hover:bg-amber-400"
          >
            {nextStep.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#1a1c24] p-4">
            <div className="flex items-center gap-2 text-white/45">
              <Package className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Produits</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">
              {stats.productCount}
            </p>
            {stats.stockBas > 0 && (
              <p className="mt-1 text-xs text-amber-400">
                {stats.stockBas} stock bas
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1a1c24] p-4">
            <div className="flex items-center gap-2 text-white/45">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Commandes</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">
              {stats.orderCount}
            </p>
            {stats.enAttente > 0 && (
              <p className="mt-1 text-xs text-amber-400">
                {stats.enAttente} en attente
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#1a1c24] p-4">
            <p className="text-xs uppercase tracking-wide text-white/45">
              Volume
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatPrice(stats.ca)}
            </p>
            <p className="mt-1 text-[11px] text-white/35">
              Encaissement plateforme — reverse hors app pour l’instant
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/vendeur/espace/produits"
            className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-[#0c0d12] hover:bg-amber-400"
          >
            Gérer les produits
          </Link>
          <Link
            href="/vendeur/espace/commandes"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Commandes
          </Link>
          <Link
            href="/vendeur/espace/pub"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Megaphone className="h-4 w-4" />
            Liens pub
          </Link>
        </div>
      </div>
    </VendorShell>
  );
}
