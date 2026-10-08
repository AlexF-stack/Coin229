import { VendorShell } from "@/components/vendeur/vendor-shell";
import { PageHeader } from "@/components/ui/page-header";
import { VendorFinances } from "@/components/vendeur/vendor-finances";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorFinances } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";

export const metadata = { title: "Finances vendeur" };
export const dynamic = "force-dynamic";

export default async function VendorFinancesPage() {
  const session = await requireVendorPage();
  const [finances, unreadMessages] = await Promise.all([
    getMyVendorFinances(),
    getVendorUnreadTotal(),
  ]);

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">
        <PageHeader title="Finances" description="Commissions, net vendeur et reversements Coin229." />
        <VendorFinances
          commissionPct={finances.commissionPct}
          caBrut={finances.brut}
          commission={finances.commission}
          net={finances.net}
          pendingPayout={finances.pendingPayout}
          inProgress={finances.inProgress}
          recentOrders={finances.orders}
        />
      </div>
    </VendorShell>
  );
}
