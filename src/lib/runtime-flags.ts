/** Flags d’environnement pour modes démo / mock */

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

/** Catalogue / commandes fantômes — interdit en prod sauf override explicite */
export function allowDemoCatalog(): boolean {
  if (process.env.ALLOW_DEMO_CATALOG === "true") return true;
  if (process.env.ALLOW_DEMO_CATALOG === "false") return false;
  return !isProductionRuntime();
}

/** Paiement Mobile Money mock — interdit en prod sauf override */
export function allowPaymentMock(): boolean {
  if (process.env.ALLOW_PAYMENT_MOCK === "true") return true;
  if (process.env.ALLOW_PAYMENT_MOCK === "false") return false;
  return !isProductionRuntime();
}
