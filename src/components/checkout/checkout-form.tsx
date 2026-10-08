"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { calculateShippingFee, ZONE_LABELS } from "@/lib/shipping";
import { ZoneSelector } from "@/components/cart/zone-selector";
import { CartChangesNotice } from "@/components/cart/cart-changes-notice";
import { useCartSync } from "@/lib/use-cart-sync";
import Link from "next/link";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { createOrder } from "@/lib/actions";
import {
  BJ_PHONE_ERROR,
  BJ_PHONE_PLACEHOLDER,
  formatBjPhone,
  normalizeBjPhone,
} from "@/lib/bj-phone";
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
  const setZone = useCartStore((s) => s.setZone);
  const clear = useCartStore((s) => s.clear);
  const removeItem = useCartStore((s) => s.removeItem);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Commande créée : on affiche la redirection au lieu du panier vidé
  const [redirecting, setRedirecting] = useState(false);
  const [mode, setMode] = useState<PaymentMode>("livraison");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [acceptCgv, setAcceptCgv] = useState(false);
  const cartSync = useCartSync();

  // Uniquement les articles choisis : jamais de repli sur tout le panier
  // (sinon on commanderait d'autres articles que ceux sélectionnés)
  const items = useMemo(() => {
    // null = pas de sélection (tout le panier) ; [] = sélection vidée → rien
    if (checkoutIds === null) return allItems;
    return allItems.filter((i) => checkoutIds.includes(i.productId));
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
      if (phone && !telephone) setTelephone(formatBjPhone(phone));
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

  if (redirecting) {
    return (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin stroke-[1.5] text-primary" />
        <p className="mt-4 font-display text-lg font-semibold text-primary">
          Commande enregistrée
        </p>
        <p className="mt-1 text-sm text-muted">Redirection…</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mx-auto mb-6 max-w-xl text-left">
          <CartChangesNotice
            changes={cartSync.changes}
            onDismiss={cartSync.dismiss}
          />
        </div>
        <p className="text-muted">Aucun article à commander.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/panier" className="btn btn-secondary">
            Voir mon panier
          </Link>
          <Link href="/boutique" className="btn btn-primary">
            Boutique
          </Link>
        </div>
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

    const normalized = normalizeBjPhone(telephone);
    if (!normalized) {
      setError(BJ_PHONE_ERROR);
      return;
    }

    localStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({
        nom: nom.trim(),
        telephone,
        adresse: adresse.trim(),
      } satisfies SavedCheckout)
    );

    startTransition(async () => {
      let result: Awaited<ReturnType<typeof createOrder>>;
      try {
        result = await createOrder({
          nom: nom.trim(),
          telephone: normalized,
          adresse: adresse.trim(),
          zone,
          modePaiement: mode,
          items: items.map((i) => ({
            productId: i.productId,
            quantite: i.quantite,
          })),
          expectedTotal: total,
        });
      } catch {
        // Réseau coupé / serveur injoignable : le formulaire reste rempli
        setError(
          "Connexion impossible. Vérifie ta connexion internet puis réessaie : ta commande n’a pas encore été envoyée."
        );
        return;
      }

      if (!result.success) {
        setError(result.error);
        // Prix / stock changés côté serveur : on met le panier à jour
        if ("priceChanged" in result) void cartSync.resync();
        return;
      }

      // La commande existe (stock réservé) : on retire les articles commandés
      // du panier pour éviter une double commande, sans afficher le panier vide
      setRedirecting(true);
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

  const fieldClass =
    "w-full rounded-control border border-border bg-white px-3 py-3 text-fg outline-none transition focus:border-primary";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-6 px-4 py-4 pb-28 md:px-0 md:py-6 md:pb-6"
    >
      <CartChangesNotice changes={cartSync.changes} onDismiss={cartSync.dismiss} />

      <section className="space-y-2 rounded-card bg-background p-5">
        <ZoneSelector value={zone} onChange={setZone} />
        <p className="text-xs text-muted">
          {ZONE_LABELS[zone]} · {shipping.etaLabel}
          {shipping.isFree ? " · livraison offerte" : ""}
        </p>
      </section>

      <section className="space-y-4 rounded-card bg-background p-5">
        <h2 className="font-display text-base font-semibold text-primary">
          Vos informations
        </h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-primary">Nom complet</span>
          <input
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            autoComplete="name"
            className={fieldClass}
            placeholder="Ex. Aïcha Dossou"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-primary">Téléphone WhatsApp</span>
          <input
            required
            type="tel"
            inputMode="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            autoComplete="tel"
            className={fieldClass}
            placeholder={BJ_PHONE_PLACEHOLDER}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-primary">
            Adresse — {ZONE_LABELS[zone]}
          </span>
          <textarea
            required
            rows={2}
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            className={cn(fieldClass, "resize-none")}
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
        <h2 className="font-display text-base font-semibold text-primary">
          Mode de paiement
        </h2>
        <button
          type="button"
          onClick={() => setMode("livraison")}
          className={cn(
            "flex w-full items-start gap-3 rounded-card border p-4 text-left transition-colors",
            mode === "livraison"
              ? "border-primary bg-background"
              : "border-border bg-white hover:border-primary/30"
          )}
        >
          <Banknote className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-success" />
          <div>
            <p className="font-medium text-primary">Paiement à la livraison</p>
            <p className="text-xs text-muted">Le plus simple — recommandé</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("mobile_money")}
          className={cn(
            "flex w-full items-start gap-3 rounded-card border p-4 text-left transition-colors",
            mode === "mobile_money"
              ? "border-primary bg-background"
              : "border-border bg-white hover:border-primary/30"
          )}
        >
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-accent-ink" />
          <div>
            <p className="font-medium text-primary">Mobile Money</p>
            <p className="text-xs text-muted">MTN MoMo ou Moov Money</p>
          </div>
        </button>
      </section>

      <section className="space-y-2 rounded-card border border-border bg-white p-5 text-sm">
        <h2 className="mb-3 font-display text-base font-semibold text-primary">
          Récapitulatif
        </h2>
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
        <div className="flex justify-between border-t border-border pt-2 text-muted">
          <span>Livraison</span>
          <span>
            {shipping.isFree ? "Offerte" : formatPrice(shipping.fee)}
          </span>
        </div>
        <div className="flex justify-between pt-1 text-base font-semibold text-primary">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </section>

      {error && (
        <p className="rounded-control bg-error/15 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <label className="flex items-start gap-3 rounded-card border border-border bg-background/60 p-4 text-sm">
        <input
          type="checkbox"
          checked={acceptCgv}
          onChange={(e) => setAcceptCgv(e.target.checked)}
          className="mt-1 h-4 w-4 accent-primary"
          required
        />
        <span className="text-muted">
          J&apos;ai lu et j&apos;accepte les{" "}
          <a
            href="/cgv"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Conditions générales de vente
          </a>{" "}
          et la{" "}
          <a
            href="/confidentialite"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Politique de confidentialité
          </a>
          . Les prix sont en FCFA (XOF).
        </span>
      </label>

      <div className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pt-3 backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button
          type="submit"
          disabled={pending || cartSync.syncing || !acceptCgv}
          className="btn btn-primary mx-auto w-full max-w-xl md:mx-0"
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
