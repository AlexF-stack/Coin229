import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/ui/page-header";
import { DesignSystemDemo } from "@/components/admin/design-system-demo";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

/** Référence visuelle des composants partagés (voir DESIGN-SYSTEM.md) — accès admin (middleware) */
export default function DesignSystemPage() {
  return (
    <AdminShell boutique="Coin229">
      <PageHeader
        eyebrow="Référence"
        title="Design system Coin229"
        description="Tokens et composants partagés par le site, l’espace client, l’espace vendeur et l’admin."
      />
      <DesignSystemDemo />
    </AdminShell>
  );
}
