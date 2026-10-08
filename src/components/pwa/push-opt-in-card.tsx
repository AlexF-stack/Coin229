"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Service worker de l'appli, ou null s'il n'y en a pas (dev sans PWA,
 * navigation privée…). navigator.serviceWorker.ready seul attend sans fin.
 */
async function getWorker(timeoutMs: number): Promise<ServiceWorkerRegistration | null> {
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg?.active) return reg;
  // Première visite : il s'installe, on lui laisse un peu de temps
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

const NO_WORKER = "Notifications indisponibles sur cette page — recharge-la, ou ouvre l’app installée.";

type Status = "loading" | "unsupported" | "denied" | "off" | "on" | "disabled";

export type PushOptInAudience = "client" | "admin" | "vendor";

const COPY: Record<PushOptInAudience, { title: string; on: string; off: string }> = {
  client: {
    title: "Alertes nouveautés & promos",
    on: "Activées sur cet appareil — tu peux les couper à tout moment.",
    off: "Reçois une notif quand on sort une pièce ou une promo.",
  },
  admin: {
    title: "Alertes admin",
    on: "Activées sur cet appareil : nouvelles commandes et nouveaux vendeurs.",
    off: "Reçois une notif à chaque nouvelle commande et inscription vendeur.",
  },
  vendor: {
    title: "Alertes commandes",
    on: "Activées sur cet appareil : tu es prévenu de chaque nouvelle commande.",
    off: "Reçois une notif dès qu’un client commande dans ta boutique.",
  },
};

export function PushOptInCard({
  audience = "client",
}: {
  audience?: PushOptInAudience;
} = {}) {
  const copy = COPY[audience];
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
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg?.active) {
          // Pas encore de service worker actif (1re visite) ou aucun (dev sans
          // PWA) : carte masquée plutôt qu'un chargement sans fin, affichée
          // dès qu'il est prêt
          if (!cancelled) setStatus("unsupported");
          reg = await navigator.serviceWorker.ready;
          if (cancelled) return;
        }
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          if (!cancelled) setStatus("off");
          return;
        }
        // L'appareil peut être abonné pour un autre public : on demande au serveur
        const state = await fetch(
          `/api/push/subscribe?audience=${audience}&endpoint=${encodeURIComponent(sub.endpoint)}`
        ).then((r) => r.json());
        if (!cancelled) setStatus(state?.subscribed ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audience]);

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

      const reg = await getWorker(10000);
      if (!reg) {
        setError(NO_WORKER);
        return;
      }
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
          audience,
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
      const reg = await getWorker(10000);
      if (!reg) {
        setError(NO_WORKER);
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Retire seulement ce public : l'appareil peut rester abonné aux autres
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, audience }),
        });
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
      <Card padding="sm">
        <Spinner label="Notifications…" />
      </Card>
    );
  }

  if (status === "unsupported" || status === "disabled") {
    return null;
  }

  // Même carte pour les clients, l'admin et les vendeurs
  return (
    <Card as="section">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          {status === "on" ? <Bell className="h-5 w-5 stroke-[1.75]" /> : <BellOff className="h-5 w-5 stroke-[1.75]" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{copy.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {status === "on"
              ? copy.on
              : status === "denied"
                ? "Bloquées par le navigateur. Autorise Coin229 dans les réglages du site."
                : copy.off}
          </p>
          {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
          {status !== "denied" && (
            <Button
              size="sm"
              variant={status === "on" ? "outline" : "primary"}
              className="mt-3"
              loading={busy}
              onClick={() => void (status === "on" ? disable() : enable())}
            >
              {status === "on" ? "Désactiver" : "Activer les notifications"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
