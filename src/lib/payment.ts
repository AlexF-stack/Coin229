import { allowPaymentMock } from "@/lib/runtime-flags";

export type PaymentMode = "mobile_money" | "livraison";

export type ProcessPaymentInput = {
  orderId: string;
  amount: number;
  mode: PaymentMode;
  phone: string;
  customerName?: string;
  provider?: "fedapay" | "kkiapay" | "mock";
};

export type ProcessPaymentResult = {
  success: boolean;
  transactionId: string | null;
  status: "pending" | "paid" | "failed" | "cod";
  message: string;
  provider: string;
  /** URL checkout hébergée (Fedapay) */
  paymentUrl?: string | null;
  /** True si le client doit ouvrir le widget KkiaPay */
  useKkiaWidget?: boolean;
};

function fedapayBaseUrl() {
  const env = (process.env.FEDAPAY_ENV || "sandbox").toLowerCase();
  return env === "live"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";
}

function parseBjPhone(phone: string): { number: string; country: string } {
  const digits = phone.replace(/\D/g, "");
  const local =
    digits.startsWith("229") && digits.length === 11
      ? digits.slice(3)
      : digits.slice(-8);
  return { number: local, country: "bj" };
}

async function createFedapayTransaction(
  input: ProcessPaymentInput
): Promise<ProcessPaymentResult> {
  const secret = process.env.FEDAPAY_SECRET_KEY!.trim();
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://coin229.vercel.app";
  const nameParts = (input.customerName || "Client Coin229").trim().split(/\s+/);
  const firstname = nameParts[0] || "Client";
  const lastname = nameParts.slice(1).join(" ") || "Coin229";
  const phone = parseBjPhone(input.phone);

  const createRes = await fetch(`${fedapayBaseUrl()}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      description: `Commande Coin229 ${input.orderId}`,
      amount: input.amount,
      currency: { iso: "XOF" },
      callback_url: `${appUrl}/api/payments/fedapay/callback?orderId=${encodeURIComponent(input.orderId)}`,
      custom_metadata: { orderId: input.orderId },
      customer: {
        firstname,
        lastname,
        phone_number: phone,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    return {
      success: false,
      transactionId: null,
      status: "failed",
      message: `Fedapay: impossible de créer le paiement (${createRes.status}). ${errText.slice(0, 120)}`,
      provider: "fedapay",
    };
  }

  const created = (await createRes.json()) as {
    v1?: { id?: number; status?: string };
    id?: number;
  };
  const txId = created.v1?.id ?? created.id;
  if (!txId) {
    return {
      success: false,
      transactionId: null,
      status: "failed",
      message: "Fedapay: réponse sans ID de transaction",
      provider: "fedapay",
    };
  }

  const tokenRes = await fetch(
    `${fedapayBaseUrl()}/transactions/${txId}/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    }
  );

  let paymentUrl: string | null = null;
  let token: string | null = null;
  if (tokenRes.ok) {
    const tokenJson = (await tokenRes.json()) as {
      token?: string;
      url?: string;
      v1?: { token?: string; url?: string };
    };
    token = tokenJson.v1?.token ?? tokenJson.token ?? null;
    paymentUrl = tokenJson.v1?.url ?? tokenJson.url ?? null;
  }

  if (!paymentUrl && token) {
    paymentUrl = `https://checkout.fedapay.com/${token}`;
  }

  return {
    success: true,
    transactionId: String(txId),
    status: "pending",
    message: "Paiement Mobile Money initié via Fedapay. Valide sur ton téléphone.",
    provider: "fedapay",
    paymentUrl,
  };
}

/**
 * Paiement isolé.
 * Priorité : Fedapay → KkiaPay widget → mock (dev) → échec.
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

  const preferred = input.provider;
  const hasFedapay = Boolean(process.env.FEDAPAY_SECRET_KEY?.trim());
  const hasKkia = Boolean(
    process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY?.trim() &&
      process.env.KKIAPAY_PRIVATE_KEY?.trim()
  );

  if (
    (preferred === "fedapay" || (!preferred && hasFedapay)) &&
    hasFedapay
  ) {
    try {
      return await createFedapayTransaction(input);
    } catch (e) {
      return {
        success: false,
        transactionId: null,
        status: "failed",
        message:
          e instanceof Error
            ? e.message
            : "Erreur Fedapay inattendue",
        provider: "fedapay",
      };
    }
  }

  if ((preferred === "kkiapay" || (!preferred && hasKkia)) && hasKkia) {
    return {
      success: true,
      transactionId: null,
      status: "pending",
      message: "Ouvre le paiement KkiaPay pour valider Mobile Money.",
      provider: "kkiapay",
      useKkiaWidget: true,
      paymentUrl: null,
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

export async function verifyKkiaTransaction(transactionId: string) {
  const privateKey = process.env.KKIAPAY_PRIVATE_KEY?.trim();
  if (!privateKey) return null;

  const sandbox =
    (process.env.KKIAPAY_ENV || "sandbox").toLowerCase() !== "live";
  const url = sandbox
    ? "https://api-sandbox.kkiapay.me/v1/transactions/status"
    : "https://api.kkiapay.me/v1/transactions/status";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": privateKey,
    },
    body: JSON.stringify({ transactionId }),
  });

  if (!res.ok) return null;
  return (await res.json()) as {
    status?: string;
    amount?: number;
    state?: string;
    partnerId?: string;
    data?: string;
    transactionId?: string;
  };
}

export async function verifyFedapayTransaction(transactionId: string) {
  const secret = process.env.FEDAPAY_SECRET_KEY?.trim();
  if (!secret) return null;

  const res = await fetch(`${fedapayBaseUrl()}/transactions/${transactionId}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    v1?: { status?: string; amount?: number; id?: number };
    status?: string;
    amount?: number;
  };
  return {
    status: json.v1?.status ?? json.status,
    amount: json.v1?.amount ?? json.amount,
    id: json.v1?.id,
  };
}
