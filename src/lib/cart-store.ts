"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryZone } from "@prisma/client";

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

type CartState = {
  items: CartItem[];
  zone: DeliveryZone;
  checkoutIds: string[] | null;
  addItem: (item: Omit<CartItem, "quantite">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantite: number) => void;
  setZone: (zone: DeliveryZone) => void;
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
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantite: Math.min(i.quantite + qty, i.stockQuantite),
                    }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantite: Math.min(qty, item.stockQuantite) },
            ],
          };
        });
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
                    ? { ...i, quantite: Math.min(quantite, i.stockQuantite) }
                    : i
                ),
        })),
      setZone: (zone) => set({ zone }),
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
