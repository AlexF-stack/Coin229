import { getAdminOverview, getDefaultVendor } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import Link from "next/link";
import { Package, ShoppingCart, TrendingUp, Undo2, Users, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

function Stat({
  icon,
  label,
  value,
  note,
  noteClass = "text-white/40",
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
  noteClass?: string;
  href?: string;
}) {
  const body = (
    <div className="h-full rounded-xl border border-white/10 bg-[#161920] p-4 transition hover:border-white/20">
      <div className="flex items-center gap-2 text-white/45">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {note && <p className={`mt-1 text-xs ${noteClass}`}>{note}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Vue d’ensemble de la marketplace — toutes les boutiques
          </p>
        </div>

        {!o ? (
          <p className="text-sm text-white/45">Données indisponibles.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Commandes"
              value={String(o.orders)}
              note={o.waiting > 0 ? `${o.waiting} en attente` : undefined}
              noteClass="text-amber-300"
              href="/admin/commandes"
            />
            <Stat
              icon={<TrendingUp className="h-4 w-4" />}
              label="Ventes"
              value={formatPrice(o.sales)}
              note={`Commission Coin229 : ${formatPrice(o.commission)} · hors livraison`}
            />
            <Stat
              icon={<Wallet className="h-4 w-4" />}
              label="À reverser aux vendeurs"
              value={formatPrice(o.toPayOut)}
              note="Commandes livrées non reversées"
              href="/admin/payouts"
            />
            <Stat
              icon={<Package className="h-4 w-4" />}
              label="Produits en ligne"
              value={String(o.products)}
              href="/admin/produits"
            />
            <Stat
              icon={<Users className="h-4 w-4" />}
              label="Vendeurs à valider"
              value={String(o.pendingVendors)}
              note={o.resetRequests > 0 ? `${o.resetRequests} demande(s) de mot de passe` : undefined}
              noteClass="text-amber-300"
              href="/admin/vendeurs"
            />
            <Stat
              icon={<Undo2 className="h-4 w-4" />}
              label="Remboursements à faire"
              value={String(o.refunds)}
              note={o.refunds > 0 ? "Commandes payées puis annulées" : undefined}
              noteClass="text-red-300"
              href="/admin/commandes"
            />
          </div>
        )}
      </div>
    </AdminShell>
  );
}
