/** Clés & helpers install PWA — côté client uniquement. */

export const PWA_DISMISS_UNTIL_KEY = "coin229-pwa-dismiss-until";
export const PWA_INSTALLED_KEY = "coin229-pwa-installed";
export const PWA_ORDER_FLAG_KEY = "coin229-pwa-after-order";

/** Soft dismiss : 7 jours (pas définitif). */
export const PWA_SOFT_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isPwaInstallBlocked(): boolean {
  try {
    if (localStorage.getItem(PWA_INSTALLED_KEY) === "1") return true;
    // Legacy dismiss définitif → convertir en soft 7j
    if (localStorage.getItem("coin229-pwa-dismiss") === "1") {
      localStorage.removeItem("coin229-pwa-dismiss");
      softDismissPwaPrompt();
    }
    const until = Number(localStorage.getItem(PWA_DISMISS_UNTIL_KEY) || 0);
    if (until && Date.now() < until) return true;
  } catch {
    // ignore
  }
  return false;
}

export function softDismissPwaPrompt() {
  try {
    localStorage.setItem(
      PWA_DISMISS_UNTIL_KEY,
      String(Date.now() + PWA_SOFT_DISMISS_MS)
    );
  } catch {
    // ignore
  }
}

export function markPwaInstalled() {
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, "1");
    localStorage.removeItem(PWA_DISMISS_UNTIL_KEY);
    localStorage.removeItem(PWA_ORDER_FLAG_KEY);
  } catch {
    // ignore
  }
}

/** À appeler sur la page confirmation commande. */
export function flagPwaAfterOrder() {
  try {
    localStorage.setItem(PWA_ORDER_FLAG_KEY, String(Date.now()));
    // Lever le soft-dismiss pour re-proposer juste après achat
    localStorage.removeItem(PWA_DISMISS_UNTIL_KEY);
  } catch {
    // ignore
  }
}

export function consumePwaAfterOrderFlag(): boolean {
  try {
    const v = localStorage.getItem(PWA_ORDER_FLAG_KEY);
    if (!v) return false;
    localStorage.removeItem(PWA_ORDER_FLAG_KEY);
    return true;
  } catch {
    return false;
  }
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}
