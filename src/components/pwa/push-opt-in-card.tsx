"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "loading" | "unsupported" | "denied" | "off" | "on" | "disabled";

export function PushOptInCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }

      try {
        const cfg = await fetch("/api/push/subscribe").then((r) => r.json());
        if (!cfg?.ok) {
          if (!cancelled) setStatus("disabled");
          return;
        }
      } catch {
        if (!cancelled) setStatus("disabled");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        setError("Permission refusée — active les notifs dans les réglages du navigateur.");
        return;
      }

      const cfg = await fetch("/api/push/subscribe").then((r) => r.json());
      if (!cfg?.ok || !cfg.publicKey) {
        setStatus("disabled");
        setError("Notifications indisponibles pour le moment.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
        });
      }

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      setStatus("on");
    } catch {
      setError("Impossible d’activer — ouvre le site en HTTPS (ou l’app installée).");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setError("Désactivation incomplète — réessaie.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Notifications…
      </div>
    );
  }

  if (status === "unsupported" || status === "disabled") {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
          {status === "on" ? (
            <Bell className="h-5 w-5 stroke-[1.5]" />
          ) : (
            <BellOff className="h-5 w-5 stroke-[1.5]" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Alertes nouveautés & promos</p>
          <p className="mt-0.5 text-xs text-muted">
            {status === "on"
              ? "Activées sur cet appareil — tu peux les couper à tout moment."
              : status === "denied"
                ? "Bloquées par le navigateur. Autorise Coin229 dans les réglages du site."
                : "Reçois une notif quand on sort une pièce ou une promo."}
          </p>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          {status !== "denied" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void (status === "on" ? disable() : enable())}
              className="btn btn-secondary mt-3 h-9 px-4 text-sm"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === "on" ? (
                "Désactiver"
              ) : (
                "Activer les notifications"
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
