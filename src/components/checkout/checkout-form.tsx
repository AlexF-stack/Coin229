"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { calculateShippingFee, ZONE_LABELS } from "@/lib/shipping";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { createOrder } from "@/lib/actions";
import type { PaymentMode } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Smartphone, Banknote, Loader2 } from "lucide-react";

const CHECKOUT_KEY = "coin229-checkout";

type SavedCheckout = {
  nom: string;
  telephone: string;
  adresse: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const allItems = useCartStore((s) => s.items);
  const checkoutIds = useCartStore((s) => s.checkoutIds);
  const zone = useCartStore((s) => s.zone);
  const clear = useCartStore((s) => s.clear);
  const removeItem = useCartStore((s) => s.removeItem);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PaymentMode>("livraison");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [acceptCgv, setAcceptCgv] = useState(false);

  const items = useMemo(() => {
    if (!checkoutIds?.length) return allItems;
    const picked = allItems.filter((i) => checkoutIds.includes(i.productId));
    return picked.length ? picked : allItems;
  }, [allItems, checkoutIds]);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(CHECKOUT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedCheckout;
        setNom(saved.nom ?? "");
        setTelephone(saved.telephone ?? "");
        setAdresse(saved.adresse ?? "");
      }
      const phone = localStorage.getItem("coin229-phone");
      if (phone && !telephone) setTelephone(phone.replace(/^\+229/, ""));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const unit = getEffectivePrice(i.prix, i.prixPromo);
        return sum + unit * i.quantite;
      }, 0),
    [items]
  );
  const shipping = useMemo(
    () => calculateShippingFee({ zone, subtotal }),
    [zone, subtotal]
  );
  const total = subtotal + shipping.fee;

  if (!mounted) return null;

  if (!items.length) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-muted">Aucun article à commander.</p>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptCgv) {
      setError("Merci d’accepter les Conditions générales de vente pour continuer.");
      return;
    }

    const phone = telephone.replace(/\s/g, "");
    if (!/^\+?229\d{8}$|^\d{8,10}$/.test(phone)) {
      setError("Numéro invalide (ex. 97 00 00 00)");
      return;
    }

    const normalized = phone.startsWith("+")
      ? phone
      : `+229${phone.replace(/^229/, "")}`;

    localStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({
        nom: nom.trim(),
        telephone,
        adresse: adresse.trim(),
      } satisfies SavedCheckout)
    );

    startTransition(async () => {
      const result = await createOrder({
        nom: nom.trim(),
        telephone: normalized,
        adresse: adresse.trim(),
        zone,
        modePaiement: mode,
        items: items.map((i) => ({
          productId: i.productId,
          quantite: i.quantite,
        })),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Retire seulement les articles commandés (sélection partielle type Shein)
      if (checkoutIds?.length && checkoutIds.length < allItems.length) {
        checkoutIds.forEach((id) => removeItem(id));
      } else {
        clear();
      }

      const pay = result.payment;
      if (
        pay &&
        (pay.paymentUrl || pay.useKkiaWidget || pay.provider === "kkiapay")
      ) {
        router.push(`/commande/paiement?id=${result.orderId}`);
        return;
      }

      router.push(`/commande/confirmation?id=${result.orderId}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-5 px-4 py-4 pb-28 md:px-0 md:py-6 md:pb-6"
    >
      <section className="space-y-3 rounded-[16px] bg-card p-4 shadow-card">
        <h2 className="font-display text-lg font-semibold">Tes infos</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Nom complet</span>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-bg px-3 py-3 outline-none focus:border-amber"
            placeholder="Ex. Aïcha Dossou"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Téléphone WhatsApp</span>
          <input
            required
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            autoComplete="tel"
            className="w-full rounded-xl border border-border bg-bg px-3 py-3 outline-none focus:border-amber"
            placeholder="97 00 00 00"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">Adresse — {ZONE_LABELS[zone]}</span>
          <textarea
            required
            rows={2}
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-3 outline-none focus:border-amber"
            placeholder="Quartier, rue, repère…"
          />
        </label>
        <p className="text-xs text-muted">
          Livraison : {shipping.etaLabel}
          {shipping.isFree
            ? " · gratuite"
            : ` · ${formatPrice(shipping.fee)}`}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Paiement</h2>
        <button
          type="button"
          onClick={() => setMode("livraison")}
          className={cn(
            "flex w-full items-start gap-3 rounded-[16px] border p-4 text-left transition-colors",
            mode === "livraison"
              ? "border-amber bg-amber/10"
              : "border-border bg-card"
          )}
        >
          <Banknote className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-green" />
          <div>
            <p className="font-medium">Paiement à la livraison</p>
            <p className="text-xs text-muted">Le plus simple — recommandé</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("mobile_money")}
          className={cn(
            "flex w-full items-start gap-3 rounded-[16px] border p-4 text-left transition-colors",
            mode === "mobile_money"
              ? "border-amber bg-amber/10"
              : "border-border bg-card"
          )}
        >
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-amber" />
          <div>
            <p className="font-medium">Mobile Money</p>
            <p className="text-xs text-muted">MTN MoMo ou Moov Money</p>
          </div>
        </button>
      </section>

      <section className="space-y-2 rounded-[16px] bg-card p-4 text-sm shadow-card">
        <h2 className="mb-2 font-display text-lg font-semibold">Total</h2>
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-muted">
            <span className="truncate pr-2">
              {i.quantite}× {i.nom}
            </span>
            <span>
              {formatPrice(getEffectivePrice(i.prix, i.prixPromo) * i.quantite)}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>À payer</span>
          <span className="text-amber">{formatPrice(total)}</span>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm">
        <input
          type="checkbox"
          checked={acceptCgv}
          onChange={(e) => setAcceptCgv(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[var(--color-amber)]"
          required
        />
        <span className="text-muted">
          J&apos;ai lu et j&apos;accepte les{" "}
          <a href="/cgv" target="_blank" rel="noreferrer" className="font-medium text-amber">
            Conditions générales de vente
          </a>{" "}
          et la{" "}
          <a
            href="/confidentialite"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-amber"
          >
            Politique de confidentialité
          </a>
          . Les prix sont en FCFA (XOF).
        </span>
      </label>

      <div className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-elevated/95 px-4 pt-3 backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button
          type="submit"
          disabled={pending || !acceptCgv}
          className="mx-auto flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-amber py-3.5 font-semibold text-navy shadow-[0_8px_20px_rgba(201,162,39,0.25)] disabled:opacity-60 md:mx-0"
        >
          {pending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin stroke-[1.5]" />
              Envoi…
            </>
          ) : (
            `Confirmer · ${formatPrice(total)}`
          )}
        </button>
      </div>
    </form>
  );
}
