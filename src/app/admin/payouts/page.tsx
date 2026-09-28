import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPayouts } from "@/components/admin/admin-payouts";
import { getDefaultVendor, listAdminPayoutData } from "@/lib/actions";

export const metadata = { title: "Reversements vendeurs" };
export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  let boutique = "Coin229";
  try {
    const v = await getDefaultVendor();
    if (v) boutique = v.nomBoutique;
  } catch {
    /* ignore */
  }

  const { unpaidVendors, recentPayouts } = await listAdminPayoutData();

  return (
    <AdminShell boutique={boutique}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reversements</h1>
          <p className="mt-1 text-sm text-white/45">
            Marquer les reversements manuels aux vendeurs marketplace.
          </p>
        </div>
        <AdminPayouts
          unpaidVendors={unpaidVendors}
          recentPayouts={recentPayouts}
        />
      </div>
    </AdminShell>
  );
}
