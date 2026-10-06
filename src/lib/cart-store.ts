"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryZone } from "@prisma/client";
import { maxOrderQty } from "@/lib/constants";

export type CartItem = {
  productId: string;
  nom: string;
  image: string;
  prix: number;
  prixPromo: number | null;
  quantite: number;
  vendorId: string;
  stockQuantite: number;
};

/** Résultat d'un ajout : l'UI affiche le bon retour et ne navigue que si "added" */
export type AddItemResult = "added" | "other_vendor" | "out_of_stock";

export const OTHER_VENDOR_MESSAGE =
  "Ton panier contient déjà des articles d’une autre boutique. Commande-les d’abord ou vide ton panier.";

/** Changement constaté en revalidant le panier auprès du serveur */
export type CartChange =
  | { type: "removed"; nom: string }
  | { type: "price"; nom: string; from: number; to: number }
  | { type: "quantity"; nom: string; to: number };

export type CartSnapshotEntry = {
  productId: string;
  nom: string;
  prix: number;
  prixPromo: number | null;
  stockQuantite: number;
  available: boolean;
};

function unitPrice(prix: number, prixPromo: number | null) {
  return prixPromo && prixPromo < prix ? prixPromo : prix;
}

type CartState = {
  items: CartItem[];
  zone: DeliveryZone;
  checkoutIds: string[] | null;
  addItem: (item: Omit<CartItem, "quantite">, qty?: number) => AddItemResult;
  /** Achat immédiat : quantité exacte (pas cumulée) + checkout sur ce seul article */
  buyNow: (item: Omit<CartItem, "quantite">, qty: number) => AddItemResult;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantite: number) => void;
  setZone: (zone: DeliveryZone) => void;
  /** Aligne prix / stock / disponibilité sur le serveur, renvoie ce qui a changé */
  applySnapshot: (snapshot: CartSnapshotEntry[]) => CartChange[];
  prepareCheckout: (productIds: string[]) => void;
  clear: () => void;
  subtotal: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      zone: "cotonou",
      checkoutIds: null,
      addItem: (item, qty = 1) => {
        const state = get();
        if (item.stockQuantite <= 0) return "out_of_stock";
        if (state.items.some((i) => i.vendorId !== item.vendorId)) {
          return "other_vendor";
        }
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantite: Math.min(i.quantite + qty, maxOrderQty(i.stockQuantite)),
                    }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantite: Math.min(qty, maxOrderQty(item.stockQuantite)) },
            ],
          };
        });
        return "added";
      },
      buyNow: (item, qty) => {
        const state = get();
        if (item.stockQuantite <= 0) return "out_of_stock";
        if (state.items.some((i) => i.vendorId !== item.vendorId)) {
          return "other_vendor";
        }
        const quantite = Math.max(1, Math.min(qty, maxOrderQty(item.stockQuantite)));
        const exists = state.items.some((i) => i.productId === item.productId);
        set({
          items: exists
            ? state.items.map((i) =>
                i.productId === item.productId ? { ...i, ...item, quantite } : i
              )
            : [...state.items, { ...item, quantite }],
          checkoutIds: [item.productId],
        });
        return "added";
      },
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
          checkoutIds: state.checkoutIds?.filter((id) => id !== productId) ?? null,
        })),
      updateQuantity: (productId, quantite) =>
        set((state) => ({
          items:
            quantite <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantite: Math.min(quantite, maxOrderQty(i.stockQuantite)) }
                    : i
                ),
        })),
      setZone: (zone) => set({ zone }),
      applySnapshot: (snapshot) => {
        const byId = new Map(snapshot.map((s) => [s.productId, s]));
        const changes: CartChange[] = [];
        const next: CartItem[] = [];
        for (const item of get().items) {
          const fresh = byId.get(item.productId);
          if (!fresh || !fresh.available) {
            changes.push({ type: "removed", nom: item.nom });
            continue;
          }
          const before = unitPrice(item.prix, item.prixPromo);
          const after = unitPrice(fresh.prix, fresh.prixPromo);
          if (before !== after) {
            changes.push({ type: "price", nom: fresh.nom, from: before, to: after });
          }
          const quantite = Math.min(item.quantite, maxOrderQty(fresh.stockQuantite));
          if (quantite < item.quantite) {
            changes.push({ type: "quantity", nom: fresh.nom, to: quantite });
          }
          next.push({
            ...item,
            nom: fresh.nom,
            prix: fresh.prix,
            prixPromo: fresh.prixPromo,
            stockQuantite: fresh.stockQuantite,
            quantite,
          });
        }
        if (changes.length) {
          const kept = new Set(next.map((i) => i.productId));
          set((state) => ({
            items: next,
            checkoutIds:
              state.checkoutIds?.filter((id) => kept.has(id)) ?? null,
          }));
        }
        return changes;
      },
      prepareCheckout: (productIds) => set({ checkoutIds: productIds }),
      clear: () => set({ items: [], checkoutIds: null }),
      subtotal: () =>
        get().items.reduce((sum, i) => {
          const unit = i.prixPromo && i.prixPromo < i.prix ? i.prixPromo : i.prix;
          return sum + unit * i.quantite;
        }, 0),
      itemCount: () => get().items.reduce((n, i) => n + i.quantite, 0),
    }),
    { name: "coin229-cart" }
  )
);
