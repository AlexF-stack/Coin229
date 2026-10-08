import { listMarketplaceVendors, getDefaultVendor } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader title="Vendeurs" description="Valider ou suspendre les marques marketplace." />
        <AdminVendors vendors={vendors} />
      </div>
    </AdminShell>
  );
}
