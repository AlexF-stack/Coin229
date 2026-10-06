"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCartSnapshot } from "@/lib/actions";
import { useCartStore, type CartChange } from "@/lib/cart-store";

/**
 * Revalide le panier auprès du serveur (prix, stock, disponibilité) à
 * l'ouverture du panier / du checkout. Renvoie les changements à afficher.
 */
export function useCartSync() {
  const applySnapshot = useCartStore((s) => s.applySnapshot);
  const [changes, setChanges] = useState<CartChange[]>([]);
  const [syncing, setSyncing] = useState(true);
  const running = useRef(false);

  const sync = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setSyncing(true);
    try {
      const ids = useCartStore.getState().items.map((i) => i.productId);
      if (!ids.length) return;
      const snapshot = await getCartSnapshot(ids);
      if (snapshot) setChanges(applySnapshot(snapshot));
    } catch {
      // Réseau indisponible : le serveur revérifie de toute façon à la commande
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    // Attendre la réhydratation du panier (localStorage) avant de comparer
    const persist = useCartStore.persist;
    if (persist.hasHydrated()) {
      void sync();
      return;
    }
    return persist.onFinishHydration(() => void sync());
  }, [sync]);

  return { changes, syncing, resync: sync, dismiss: () => setChanges([]) };
}
