import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPushPanel } from "@/components/admin/admin-push-panel";
import { getDefaultVendor } from "@/lib/actions";

export const metadata = {
  title: "Notifications",
};

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  let boutique = "Coin229 Boutique";
  try {
    const vendor = await getDefaultVendor();
    if (vendor) boutique = vendor.nomBoutique;
  } catch {
    // ignore
  }

  return (
    <AdminShell boutique={boutique}>
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Notifications push
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Envoie une alerte aux visiteurs qui ont activé les notifications.
          </p>
        </div>
        <AdminPushPanel />
      </div>
    </AdminShell>
  );
}
