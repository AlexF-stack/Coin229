import { Suspense } from "react";
import { AuthFallback } from "@/components/ui/auth-card";
import { VendorResetForm } from "@/components/vendeur/vendor-reset-form";

export const metadata = { title: "Réinitialiser le mot de passe" };

export default function VendorResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <VendorResetForm />
    </Suspense>
  );
}
