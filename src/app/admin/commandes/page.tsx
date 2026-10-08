import {
  getAdminOrders,
  getDefaultVendor,
  listMarketplaceVendors,
} from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOrders } from "@/components/admin/admin-orders";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/navigation";

export const metadata = {
  title: "Commandes · Admin",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ vendeur?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { vendeur } = await searchParams;
  let boutique = "Coin229 Boutique";
  try {
    const v = await getDefaultVendor();
    if (v) boutique = v.nomBoutique;
  } catch {
    // ignore
  }

  // Toute la marketplace, filtrable par vendeur
  const [vendors, orders] = await Promise.all([
    listMarketplaceVendors(),
    getAdminOrders({ vendorId: vendeur || undefined }),
  ]);
  return (
    <AdminShell boutique={boutique}>
      <PageHeader title="Commandes" description="Toutes les boutiques de la marketplace — suivi et changement de statut" />
      <Tabs
        ariaLabel="Filtrer par boutique"
        value={vendeur || "toutes"}
        className="mb-6"
        items={[
          { key: "toutes", label: "Toutes", href: "/admin/commandes" },
          ...vendors
            .filter((v) => v._count.orders > 0)
            .map((v) => ({
              key: v.id,
              label: `${v.nomBoutique} (${v._count.orders})`,
              href: `/admin/commandes?vendeur=${encodeURIComponent(v.id)}`,
            })),
        ]}
      />
      <AdminOrders orders={orders} />
    </AdminShell>
  );
}
