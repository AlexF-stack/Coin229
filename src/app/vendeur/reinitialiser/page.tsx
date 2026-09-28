import { Suspense } from "react";
import { VendorResetForm } from "@/components/vendeur/vendor-reset-form";

export const metadata = { title: "Réinitialiser le mot de passe" };

export default function VendorResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#0c0d12] text-white/50">
          Chargement…
        </div>
      }
    >
      <VendorResetForm />
    </Suspense>
  );
}
