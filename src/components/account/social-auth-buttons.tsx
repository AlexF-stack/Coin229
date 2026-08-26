"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Provider = "google" | "facebook";

export function SocialAuthButtons() {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function signIn(provider: Provider) {
    setError(null);
    if (!configured) {
      setError(
        "Configure Supabase + les providers Google/Facebook dans le dashboard."
      );
      return;
    }
    setPending(provider);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=/compte`,
          queryParams:
            provider === "google"
              ? { access_type: "offline", prompt: "consent" }
              : undefined,
        },
      });
      if (err) {
        setError(err.message);
        setPending(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible");
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative py-1 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-bg-elevated px-3 text-xs text-muted">
          ou continuer avec
        </span>
      </div>

      <button
        type="button"
        disabled={Boolean(pending)}
        onClick={() => void signIn("google")}
        className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card py-3 text-sm font-semibold transition hover:border-amber disabled:opacity-60"
      >
        {pending === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Google
      </button>

      <button
        type="button"
        disabled={Boolean(pending)}
        onClick={() => void signIn("facebook")}
        className="flex w-full items-center justify-center gap-2.5 rounded-full border border-border bg-[#1877F2] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {pending === "facebook" ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <FacebookIcon />
        )}
        Facebook
      </button>

      {error && <p className="text-center text-xs text-coral">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.1l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.8-.9 6.4-2.3l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4l-3.2 2.5C5.2 19.8 8.3 22 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.6 14.2c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.4 8C2.7 9.4 2.3 10.9 2.3 12.3c0 1.4.4 2.9 1.1 4.2l3.2-2.3z"
      />
      <path
        fill="#4285F4"
        d="M12 5.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.8 14.6 2 12 2 8.3 2 5.2 4.2 3.4 7.5l3.2 2.5C7.4 7.5 9.5 5.8 12 5.8z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}
