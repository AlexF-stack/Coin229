"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import {
  cn,
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
} from "@/lib/utils";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { FreeShippingProgress } from "@/components/cart/free-shipping-progress";
import { ZoneSelector } from "@/components/cart/zone-selector";
import { calculateShippingFee } from "@/lib/shipping";

export function CartView() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const zone = useCartStore((s) => s.zone);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const setZone = useCartStore((s) => s.setZone);
  const prepareCheckout = useCartStore((s) => s.prepareCheckout);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSelected(new Set(items.map((i) => i.productId)));
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.productId)),
    [items, selected]
  );

  const subtotal = useMemo(
    () =>
      selectedItems.reduce((sum, i) => {
        const unit = getEffectivePrice(i.prix, i.prixPromo);
        return sum + unit * i.quantite;
      }, 0),
    [selectedItems]
  );

  const listPrice = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.prix * i.quantite, 0),
    [selectedItems]
  );

  const savings = Math.max(0, listPrice - subtotal);

  const shipping = useMemo(
    () => calculateShippingFee({ zone, subtotal }),
    [zone, subtotal]
  );

  const itemCount = selectedItems.reduce((n, i) => n + i.quantite, 0);
  const allSelected = items.length > 0 && selected.size === items.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.productId)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveToWishlist(productId: string) {
    toggleWish(productId);
    removeItem(productId);
  }

  function goCheckout() {
    if (!selected.size) return;
    prepareCheckout([...selected]);
    router.push("/commande");
  }

  if (!mounted) {
    return (
      <div className="space-y-4 px-4 py-6">
        <div className="h-24 animate-pulse rounded-2xl bg-card" />
        <div className="h-28 animate-pulse rounded-2xl bg-card" />
        <div className="h-28 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-muted">
          <ShoppingBag className="h-9 w-9 stroke-[1.25]" />
        </span>
        <p className="mt-5 font-display text-2xl font-bold">Panier vide</p>
        <p className="mt-2 text-sm text-muted">
          Remplis-le avec des montres, bijoux, sacs ou lunettes — livraison Cotonou &amp;
          environs.
        </p>
        <Link
          href="/"
          className="mt-6 w-full rounded-full bg-amber py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(43,155,255,0.25)] transition active:scale-[0.98]"
        >
          Continuer mes achats
        </Link>
        <Link
          href="/favoris"
          className="mt-3 text-sm font-medium text-amber hover:underline"
        >
          Voir mes favoris
        </Link>
      </div>
    );
  }

  const total = subtotal + (selectedItems.length ? shipping.fee : 0);
  const canCheckout = selectedItems.length > 0;

  return (
    <div className="pb-28 md:pb-8">
      <div className="space-y-5 px-4 py-4 md:grid md:grid-cols-[1.45fr_0.85fr] md:items-start md:gap-8 md:space-y-0 md:px-0 md:py-6">
        <div className="space-y-4">
          <FreeShippingProgress
            amountToFreeShipping={shipping.amountToFreeShipping}
            isFree={shipping.isFree}
            threshold={shipping.freeShippingThreshold}
            subtotal={subtotal}
          />

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 text-sm">
            <label className="flex cursor-pointer items-center gap-2.5 font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-[var(--color-amber)]"
              />
              Tout sélectionner
            </label>
            <span className="text-xs text-muted">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="md:hidden">
            <ZoneSelector value={zone} onChange={setZone} />
          </div>

          <ul className="space-y-3">
            {items.map((item) => {
              const unit = getEffectivePrice(item.prix, item.prixPromo);
              const discount = getDiscountPercent(item.prix, item.prixPromo);
              const checked = selected.has(item.productId);
              const line = unit * item.quantite;

              return (
                <li
                  key={item.productId}
                  className={cn(
                    "flex gap-3 rounded-2xl border bg-card p-3 shadow-card transition md:p-4",
                    checked ? "border-border" : "border-border/60 opacity-70"
                  )}
                >
                  <label className="flex shrink-0 items-start pt-8">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(item.productId)}
                      className="h-4 w-4 accent-[var(--color-amber)]"
                      aria-label={`Sélectionner ${item.nom}`}
                    />
                  </label>

                  <Link
                    href={`/produit/${item.productId}`}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-surface md:h-28 md:w-24"
                  >
                    <Image
                      src={item.image || "/placeholder-product.svg"}
                      alt={item.nom}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                    {discount && (
                      <span className="absolute left-1 top-1 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                        -{discount}%
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/produit/${item.productId}`}
                        className="line-clamp-2 text-sm font-medium leading-snug"
                      >
                        {item.nom}
                      </Link>
                      <button
                        type="button"
                        aria-label="Retirer"
                        onClick={() => removeItem(item.productId)}
                        className="shrink-0 rounded-full p-1 text-muted hover:bg-surface hover:text-coral"
                      >
                        <Trash2 className="h-4 w-4 stroke-[1.5]" />
                      </button>
                    </div>

                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                      <p className="font-semibold text-amber">
                        {formatPrice(unit)}
                      </p>
                      {item.prixPromo && item.prixPromo < item.prix && (
                        <p className="text-xs text-muted line-through">
                          {formatPrice(item.prix)}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <QuantitySelector
                        value={item.quantite}
                        max={item.stockQuantite}
                        onChange={(q) => updateQuantity(item.productId, q)}
                      />
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatPrice(line)}</p>
                        <button
                          type="button"
                          onClick={() => moveToWishlist(item.productId)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted hover:text-rose"
                        >
                          <Heart className="h-3 w-3 stroke-[1.5]" />
                          Favoris
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="hidden space-y-4 md:sticky md:top-24 md:block">
          <ZoneSelector value={zone} onChange={setZone} />

          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="font-display text-lg font-semibold">Récapitulatif</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Sous-total ({itemCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green">
                  <span>Économies</span>
                  <span>−{formatPrice(savings)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Livraison</span>
                <span className={shipping.isFree ? "font-medium text-green" : ""}>
                  {!canCheckout
                    ? "—"
                    : shipping.isFree
                      ? "Gratuite"
                      : formatPrice(shipping.fee)}
                </span>
              </div>
              <p className="text-xs text-muted">{shipping.etaLabel}</p>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="text-amber">
                  {formatPrice(canCheckout ? total : 0)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canCheckout}
              onClick={goCheckout}
              className="flex w-full items-center justify-center rounded-full bg-amber py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              {canCheckout
                ? `Commander · ${formatPrice(total)}`
                : "Sélectionne un article"}
            </button>

            <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3 stroke-[1.5]" /> Paiement sécurisé
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 stroke-[1.5]" /> COD dispo
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="block text-center text-sm text-muted hover:text-fg"
          >
            Continuer mes achats
          </Link>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-bg-elevated/95 px-3 py-2.5 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <label className="flex shrink-0 items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-[var(--color-amber)]"
            />
            Tout
          </label>
          <div className="min-w-0 flex-1">
            {savings > 0 && (
              <p className="text-[10px] font-medium text-green">
                Économie {formatPrice(savings)}
              </p>
            )}
            <p className="truncate text-sm">
              <span className="text-muted">Total </span>
              <span className="font-display text-base font-bold text-amber">
                {formatPrice(canCheckout ? total : 0)}
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={!canCheckout}
            onClick={goCheckout}
            className="shrink-0 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Commander
          </button>
        </div>
      </div>
    </div>
  );
}
