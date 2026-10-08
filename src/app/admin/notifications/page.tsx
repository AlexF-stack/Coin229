import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPushPanel } from "@/components/admin/admin-push-panel";
import { PushOptInCard } from "@/components/pwa/push-opt-in-card";
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
        <PageHeader title="Notifications push" description="Envoie une annonce aux clients qui ont activé les notifications." />
        <PushOptInCard audience="admin" />
        <AdminPushPanel />
      </div>
    </AdminShell>
  );
}
