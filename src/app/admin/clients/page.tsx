import { AdminShell } from "@/components/admin/admin-shell";
import { AdminClients } from "@/components/admin/admin-clients";
import { PageHeader } from "@/components/ui/page-header";
import { getDefaultVendor, listClientAccounts } from "@/lib/actions";

export const metadata = { title: "Clients · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  let boutique = "Coin229 Boutique";
  try {
    const v = await getDefaultVendor();
    if (v) boutique = v.nomBoutique;
  } catch {
    // ignore
  }
  const clients = await listClientAccounts();
  return (
    <AdminShell boutique={boutique}>
      <PageHeader
        title="Clients"
        description="Comptes email + mot de passe. Un client a oublié son mot de passe ? Envoie-lui un lien depuis ici : il part à l’adresse de son compte."
      />
      <AdminClients clients={clients} />
    </AdminShell>
  );
}
