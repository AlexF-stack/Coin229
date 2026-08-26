import { allowPaymentMock } from "@/lib/runtime-flags";

export type PaymentMode = "mobile_money" | "livraison";

export type ProcessPaymentInput = {
  orderId: string;
  amount: number;
  mode: PaymentMode;
  phone: string;
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
 * Paiement isolé.
 * - COD : toujours OK
 * - Mobile Money : exige un provider réel en prod (sinon échec explicite)
 */
export async function processPayment(
  input: ProcessPaymentInput
): Promise<ProcessPaymentResult> {
  if (input.mode === "livraison") {
    return {
      success: true,
      transactionId: null,
      status: "cod",
      message: "Commande enregistrée — paiement à la livraison",
      provider: "cash_on_delivery",
    };
  }

  const hasFedapay = Boolean(process.env.FEDAPAY_SECRET_KEY?.trim());
  const hasKkia = Boolean(process.env.KKIAPAY_PRIVATE_KEY?.trim());

  if (hasFedapay || hasKkia) {
    // Branchement PSP : laisser pending jusqu’au webhook
    return {
      success: true,
      transactionId: `pending_${input.orderId}`,
      status: "pending",
      message:
        "Paiement Mobile Money initié — confirmation après validation opérateur.",
      provider: hasFedapay ? "fedapay" : "kkiapay",
    };
  }

  if (allowPaymentMock()) {
    await new Promise((r) => setTimeout(r, 400));
    return {
      success: true,
      transactionId: `mock_${Date.now()}_${input.orderId.slice(0, 8)}`,
      status: "pending",
      message: "Mock Mobile Money (dev uniquement) — non confirmé comme payé.",
      provider: "mock",
    };
  }

  return {
    success: false,
    transactionId: null,
    status: "failed",
    message:
      "Mobile Money indisponible. Choisis le paiement à la livraison, ou configure Fedapay / KkiaPay.",
    provider: "none",
  };
}
