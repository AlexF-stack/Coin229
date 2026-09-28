import { VendorShell } from "@/components/vendeur/vendor-shell";
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
        <div>
          <h1 className="text-2xl font-semibold text-white">Commandes</h1>
          <p className="mt-1 text-sm text-white/45">
            Uniquement les commandes de ta marque.
          </p>
        </div>
        <VendorOrders orders={orders} />
      </div>
    </VendorShell>
  );
}
