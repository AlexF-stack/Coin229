import Link from "next/link";
import { VendorShell } from "@/components/vendeur/vendor-shell";
import { PushOptInCard } from "@/components/pwa/push-opt-in-card";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorStats } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingCart, Megaphone, ArrowRight, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";

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
      <PageHeader
        title="Tableau de bord"
        description={`${session.nomBoutique}${session.statut === "en_attente" ? " — en attente de validation Coin229" : ""}`}
      />

      <div className="space-y-6">
        {/* Action principale du moment : seule zone en Deep Green + Gold */}
        <section className="rounded-card bg-surface-inverse p-5 text-inverse shadow-card md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Prochaine étape</p>
          <p className="mt-1 font-display text-lg font-semibold text-inverse">{nextStep.title}</p>
          <p className="mt-1 text-sm text-inverse/75">{nextStep.body}</p>
          <Link href={nextStep.href} className={buttonClasses({ variant: "accent", className: "mt-4" })}>
            {nextStep.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <PushOptInCard audience="vendor" />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Package />}
            label="Produits"
            value={stats.productCount}
            hint={stats.stockBas > 0 ? `${stats.stockBas} stock bas` : undefined}
            tone={stats.stockBas > 0 ? "warning" : undefined}
            href="/vendeur/espace/produits"
          />
          <StatCard
            icon={<ShoppingCart />}
            label="Commandes"
            value={stats.orderCount}
            hint={stats.enAttente > 0 ? `${stats.enAttente} en attente` : undefined}
            tone={stats.enAttente > 0 ? "warning" : undefined}
            href="/vendeur/espace/commandes"
          />
          <StatCard
            icon={<TrendingUp />}
            label="Ventes"
            value={formatPrice(stats.ca)}
            hint="Commandes confirmées, hors livraison — détail dans Finances"
            href="/vendeur/espace/finances"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/vendeur/espace/produits" className={buttonClasses()}>
            Gérer les produits
          </Link>
          <Link href="/vendeur/espace/commandes" className={buttonClasses({ variant: "outline" })}>
            Commandes
          </Link>
          <Link href="/vendeur/espace/pub" className={buttonClasses({ variant: "outline" })}>
            <Megaphone className="h-4 w-4" />
            Liens pub
          </Link>
        </div>
      </div>
    </VendorShell>
  );
}
