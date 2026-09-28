import { listMarketplaceVendors, getDefaultVendor } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminVendors } from "@/components/admin/admin-vendors";

export const metadata = { title: "Vendeurs" };
export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  let boutique = "Coin229";
  try {
    const v = await getDefaultVendor();
    if (v) boutique = v.nomBoutique;
  } catch {
    /* ignore */
  }
  const vendors = await listMarketplaceVendors();

  return (
    <AdminShell boutique={boutique}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Vendeurs</h1>
          <p className="mt-1 text-sm text-white/45">
            Valider ou suspendre les marques marketplace.
          </p>
        </div>
        <AdminVendors vendors={vendors} />
      </div>
    </AdminShell>
  );
}
