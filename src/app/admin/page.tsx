import { getAdminOverview, getDefaultVendor } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/feedback";
import { Package, ShoppingCart, TrendingUp, Undo2, Users, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let boutique = "Coin229 Boutique";
  try {
    const v = await getDefaultVendor();
    if (v) boutique = v.nomBoutique;
  } catch {
    // ignore
  }
  // Vue d'ensemble de TOUTE la marketplace (plus seulement la boutique maison)
  const o = await getAdminOverview();

  return (
    <AdminShell boutique={boutique}>
      <PageHeader title="Tableau de bord" description="Vue d’ensemble de la marketplace — toutes les boutiques" />
      {!o ? (
        <ErrorState description="Les chiffres de la marketplace n’ont pas pu être chargés. Recharge la page." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<ShoppingCart />}
            label="Commandes"
            value={String(o.orders)}
            hint={o.waiting > 0 ? `${o.waiting} en attente` : "Aucune en attente"}
            tone={o.waiting > 0 ? "warning" : undefined}
            href="/admin/commandes"
          />
          <StatCard
            icon={<TrendingUp />}
            label="Ventes"
            value={formatPrice(o.sales)}
            hint={`Commission Coin229 : ${formatPrice(o.commission)} · hors livraison`}
          />
          <StatCard
            icon={<Wallet />}
            label="À reverser aux vendeurs"
            value={formatPrice(o.toPayOut)}
            hint="Commandes livrées non reversées"
            href="/admin/payouts"
          />
          <StatCard icon={<Package />} label="Produits en ligne" value={String(o.products)} href="/admin/produits" />
          <StatCard
            icon={<Users />}
            label="Vendeurs à valider"
            value={String(o.pendingVendors)}
            hint={o.resetRequests > 0 ? `${o.resetRequests} demande(s) de mot de passe` : undefined}
            tone={o.resetRequests > 0 ? "warning" : undefined}
            href="/admin/vendeurs"
          />
          <StatCard
            icon={<Undo2 />}
            label="Remboursements à faire"
            value={String(o.refunds)}
            hint={o.refunds > 0 ? "Commandes payées puis annulées" : undefined}
            tone={o.refunds > 0 ? "error" : undefined}
            href="/admin/commandes"
          />
        </div>
      )}
    </AdminShell>
  );
}
