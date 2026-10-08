import { VendorShell } from "@/components/vendeur/vendor-shell";
import { PageHeader } from "@/components/ui/page-header";
import { VendorOrders } from "@/components/vendeur/vendor-orders";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorOrders } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";

export const metadata = { title: "Mes commandes" };
export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const session = await requireVendorPage();

  const [orders, unreadMessages] = await Promise.all([
    getMyVendorOrders(),
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
        <PageHeader title="Commandes" description="Uniquement les commandes de ta marque." />
        <VendorOrders orders={orders} />
      </div>
    </VendorShell>
  );
}
