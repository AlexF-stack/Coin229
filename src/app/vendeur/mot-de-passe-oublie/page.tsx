import { Suspense } from "react";
import { AuthFallback } from "@/components/ui/auth-card";
import { VendorForgotForm } from "@/components/vendeur/vendor-forgot-form";

export const metadata = { title: "Mot de passe oublié" };

export default function VendorForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <VendorForgotForm />
    </Suspense>
  );
}
