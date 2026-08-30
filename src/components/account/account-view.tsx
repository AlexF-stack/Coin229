"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";
import { PhoneAuthForm } from "./phone-auth-form";
import { SocialAuthButtons } from "./social-auth-buttons";
import { getAccountSession, getMyOrders } from "@/lib/actions";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { ZONE_LABELS } from "@/lib/shipping";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { PushOptInCard } from "@/components/pwa/push-opt-in-card";

type ClientData = NonNullable<Awaited<ReturnType<typeof getMyOrders>>>;

const BENEFITS = [
  {
    icon: Package,
    title: "Suivi commandes",
    text: "Statut et historique en un coup d’œil",
  },
  {
    icon: Truck,
    title: "Checkout plus rapide",
    text: "Adresse et infos déjà prêtes",
  },
  {
    icon: Heart,
    title: "Favoris synchronisés",
    text: "Retrouve tes pièces sur cet appareil",
  },
];

export function AccountView() {
  const [identity, setIdentity] = useState<{
    label: string;
    provider: string;
  } | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const cartCount = useCartStore((s) =>
    s.items.reduce((n, i) => n + i.quantite, 0)
  );
  const favCount = useWishlistStore((s) => s.ids.length);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getAccountSession();
        if (!cancelled && session) {
          setIdentity(session);
        }
      } catch {
        // pas de session
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!identity) {
      setClient(null);
      return;
    }
    setLoading(true);
    getMyOrders()
      .then((data) => setClient(data))
      .finally(() => setLoading(false));
  }, [identity]);

  async function logout() {
    await fetch("/api/auth/phone-session", { method: "DELETE" });
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setIdentity(null);
    setClient(null);
  }

  function onPhoneAuth(phone: string) {
    setIdentity({ label: phone, provider: "phone" });
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="h-40 animate-pulse rounded-3xl bg-card" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="relative overflow-hidden pb-10">
        <div className="relative isolate overflow-hidden px-4 pb-10 pt-8 md:px-0 md:pt-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(239,159,39,0.28),transparent),radial-gradient(ellipse_50%_40%_at_100%_20%,rgba(216,90,48,0.18),transparent)]"
          />
          <div className="mx-auto max-w-md text-center">
            <p className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Coin<span className="text-amber">229</span>
            </p>
            <h1 className="mt-4 font-display text-2xl font-bold md:text-3xl">
              Connexion
            </h1>
            <p className="mt-2 text-sm text-muted">
              Google, Facebook ou numéro SMS — à toi de choisir.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-md space-y-6 px-4 md:px-0">
          <div className="space-y-5 rounded-3xl border border-border bg-bg-elevated p-5 shadow-card md:p-6">
            <SocialAuthButtons />
            <PhoneAuthForm onAuthenticated={onPhoneAuth} />
          </div>

          <ul className="grid gap-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-2xl bg-card/80 px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
                  <Icon className="h-4 w-4 stroke-[1.5]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <InstallAppCard
            variant="card"
            title="Ou installe l’app"
            description="Sans créer de compte tout de suite — ajoute Coin229 à ton écran d’accueil."
          />

          <PushOptInCard />

          <p className="text-center text-xs text-muted">
            Tu peux aussi{" "}
            <Link href="/" className="font-medium text-amber hover:underline">
              continuer sans compte
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const hub = [
    {
      href: "#commandes",
      label: "Commandes",
      hint: loading ? "…" : `${client?.orders.length ?? 0}`,
      icon: Package,
    },
    {
      href: "/favoris",
      label: "Favoris",
      hint: String(favCount),
      icon: Heart,
    },
    {
      href: "/panier",
      label: "Panier",
      hint: String(cartCount),
      icon: ShoppingBag,
    },
    {
      href: "/livraison",
      label: "Livraison",
      hint: "Zones",
      icon: Truck,
    },
  ];

  const providerLabel =
    identity.provider === "google"
      ? "Google"
      : identity.provider === "facebook"
        ? "Facebook"
        : identity.provider === "phone"
          ? "SMS"
          : "Compte";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 pt-5 md:px-0 md:pt-8">
      <section className="overflow-hidden rounded-3xl border border-border bg-bg-elevated shadow-card">
        <div className="relative bg-[linear-gradient(135deg,#1a1916_0%,#3d2a1a_55%,#d4890f_120%)] px-5 py-6 text-white md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <UserRound className="h-6 w-6 stroke-[1.5]" />
              </span>
              <div>
                <p className="font-display text-xl font-bold">
                  {client?.nom ?? "Bonjour"}
                </p>
                <p className="text-sm text-white/75">{identity.label}</p>
                <p className="mt-0.5 text-[11px] text-white/55">
                  Via {providerLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/20"
            >
              <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
              Sortir
            </button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-white/80">
            <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
            Membre Coin229 · paiement à la livraison disponible
          </p>
        </div>

        <div className="grid grid-cols-4 gap-1 p-3">
          {hub.map(({ href, label, hint, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-center transition hover:bg-surface"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/12 text-amber">
                <Icon className="h-5 w-5 stroke-[1.5]" />
              </span>
              <span className="text-[11px] font-medium leading-tight">
                {label}
              </span>
              <span className="text-[10px] text-muted">{hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <InstallAppCard
        variant="card"
        title="Installer l’app Coin229"
        description="Sur ton écran d’accueil : commandes, favoris et panier en un tap."
      />

      <PushOptInCard />

      <section id="commandes" className="scroll-mt-24 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Mes commandes</h2>
          {client && client.orders.length > 0 && (
            <span className="text-xs text-muted">
              {client.orders.length} au total
            </span>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-24 animate-pulse rounded-2xl bg-card" />
            <div className="h-24 animate-pulse rounded-2xl bg-card" />
          </div>
        )}

        {!client?.orders.length && !loading && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
            <Package className="mx-auto h-8 w-8 stroke-[1.5] text-muted" />
            <p className="mt-3 text-sm font-medium">Aucune commande</p>
            <p className="mt-1 text-xs text-muted">
              Tes achats apparaîtront ici après validation.
            </p>
            <Link
              href="/boutique"
              className="mt-4 inline-flex rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-navy"
            >
              Explorer la boutique
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {client?.orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted">
                    {new Date(order.dateCreation).toLocaleDateString("fr-BJ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-amber">
                    {formatPrice(order.montantTotal)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    ORDER_STATUS_COLORS[order.statut]
                  )}
                >
                  {ORDER_STATUS_LABELS[order.statut]}
                </span>
              </div>
              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {item.quantite}× {item.product.nom}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <MapPin className="h-5 w-5 stroke-[1.5] text-violet" />
          Adresses
        </h2>
        {!client?.adresses.length && !loading && (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted">
            Les adresses sont enregistrées à la première commande.
          </p>
        )}
        <ul className="space-y-2">
          {client?.adresses.map((addr) => (
            <li
              key={addr.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ZONE_LABELS[addr.zone]}</span>
                  {addr.estPrincipale && (
                    <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-medium text-amber">
                      Principale
                    </span>
                  )}
                </div>
                <p className="mt-1 text-muted">{addr.adresseComplete}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
