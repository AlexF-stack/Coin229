export type PaymentMode = "mobile_money" | "livraison";

export type ProcessPaymentInput = {
  orderId: string;
  amount: number;
  mode: PaymentMode;
  phone: string;
  /** Provider cible pour branchement futur (Fedapay / KkiaPay) */
  provider?: "fedapay" | "kkiapay" | "mock";
};

export type ProcessPaymentResult = {
  success: boolean;
  transactionId: string | null;
  status: "pending" | "paid" | "failed" | "cod";
  message: string;
  provider: string;
};

/**
 * Point d'entrée isolé pour le paiement.
 * Mocké pour le lancement — brancher Fedapay ou KkiaPay ici sans toucher au tunnel.
 */
export async function processPayment(
  input: ProcessPaymentInput
): Promise<ProcessPaymentResult> {
  // Paiement à la livraison : pas d'appel API
  if (input.mode === "livraison") {
    return {
      success: true,
      transactionId: null,
      status: "cod",
      message: "Commande enregistrée — paiement à la livraison",
      provider: "cash_on_delivery",
    };
  }

  // TODO: brancher Fedapay / KkiaPay (Mobile Money MTN / Moov Bénin)
  // Exemple futur :
  // const client = createFedapayClient(process.env.FEDAPAY_SECRET_KEY!)
  // const tx = await client.transactions.create({ amount: input.amount, ... })

  const provider = input.provider ?? "mock";
  await new Promise((r) => setTimeout(r, 600));

  return {
    success: true,
    transactionId: `mock_${Date.now()}_${input.orderId.slice(0, 8)}`,
    status: "pending",
    message: "Paiement Mobile Money en cours de confirmation.",
    provider,
  };
}
