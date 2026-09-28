import { Suspense } from "react";
import { VendorForgotForm } from "@/components/vendeur/vendor-forgot-form";

export const metadata = { title: "Mot de passe oublié" };

export default function VendorForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#0c0d12] text-white/50">
          Chargement…
        </div>
      }
    >
      <VendorForgotForm />
    </Suspense>
  );
}
