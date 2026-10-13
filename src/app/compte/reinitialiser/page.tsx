import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/account/reset-password-form";
import { Spinner } from "@/components/ui/feedback";

export const metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default function ClientResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-14">
      <Suspense fallback={<Spinner />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
