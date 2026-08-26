import { getDefaultVendor, getVendorOrders } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOrders } from "@/components/admin/admin-orders";
import { DEMO_VENDOR_ID } from "@/lib/demo-data";

export const metadata = {
  title: "Commandes · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let vendorId = DEMO_VENDOR_ID;
  let orders: Awaited<ReturnType<typeof getVendorOrders>> = [];
  let boutique = "Coin229 Boutique";

  try {
    const vendor = await getDefaultVendor();
    if (vendor) {
      vendorId = vendor.id;
      boutique = vendor.nomBoutique;
      orders = await getVendorOrders(vendor.id);
    }
  } catch {
    // démo
  }

  return (
    <AdminShell boutique={boutique}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Commandes</h1>
          <p className="mt-1 text-sm text-white/45">
            Suivi et changement de statut
          </p>
        </div>
        <AdminOrders orders={orders} vendorId={vendorId} />
      </div>
    </AdminShell>
  );
}
