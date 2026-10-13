import { allowPaymentMock } from "@/lib/runtime-flags";
import { allowDemoOtp } from "@/lib/phone-session";

/**
 * Options affichées seulement quand elles fonctionnent vraiment
 * (pas d'impasse pour le client tant qu'un service n'est pas branché).
 */

/** Mobile Money : un prestataire configuré (FedaPay ou KkiaPay), ou le mode test en local */
export function isMobileMoneyAvailable(): boolean {
  const fedapay = Boolean(process.env.FEDAPAY_SECRET_KEY?.trim());
  const kkiapay = Boolean(process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY?.trim() && process.env.KKIAPAY_PRIVATE_KEY?.trim());
  return fedapay || kkiapay || allowPaymentMock();
}

/** Connexion par SMS : activée explicitement (SMS_LOGIN_ENABLED=true) une fois le fournisseur SMS branché */
export function isSmsLoginEnabled(): boolean {
  return process.env.SMS_LOGIN_ENABLED === "true" || allowDemoOtp();
}
