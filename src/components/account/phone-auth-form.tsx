"use client";

import { buttonClasses } from "@/components/ui/button";
import { useState, useTransition, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BJ_PHONE_ERROR,
  BJ_PHONE_PLACEHOLDER,
  normalizeBjPhone,
} from "@/lib/bj-phone";

type Props = {
  onAuthenticated: (phone: string) => void;
};

export function PhoneAuthForm({ onAuthenticated }: Props) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendIn, setResendIn] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = otpDigits.join("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    const normalized = normalizeBjPhone(phone);
    if (!normalized) {
      setError(BJ_PHONE_ERROR);
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: err } = await supabase.auth.signInWithOtp({
          phone: normalized,
        });

        if (err) {
          const isPlaceholder =
            process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") ||
            err.message.toLowerCase().includes("fetch");
          if (isPlaceholder && process.env.NODE_ENV !== "production") {
            setInfo("Mode démo local — utilise le code 123456.");
            setPhone(normalized);
            setStep("otp");
            setResendIn(45);
            setOtpDigits(["", "", "", "", "", ""]);
            return;
          }
          setError(err.message || "Impossible d’envoyer le SMS.");
          return;
        }

        setPhone(normalized);
        setStep("otp");
        setResendIn(45);
        setOtpDigits(["", "", "", "", "", ""]);
        setInfo("Code SMS envoyé.");
      } catch {
        setError("Impossible d’envoyer le SMS. Réessaie.");
      }
    });
  }

  function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (otp.length < 6) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/auth/phone-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        phone?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok || !data.phone) {
        setError(data?.error || "Code incorrect. Réessaie.");
        return;
      }
      onAuthenticated(data.phone);
    });
  }

  function onDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === 5 && next.every(Boolean)) {
      window.setTimeout(() => {
        const form = document.getElementById(
          "otp-form"
        ) as HTMLFormElement | null;
        form?.requestSubmit();
      }, 50);
    }
  }

  function onDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setOtpDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  if (step === "otp") {
    return (
      <form id="otp-form" onSubmit={verifyOtp} className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-muted">Code envoyé au</p>
          <p className="mt-0.5 font-display text-lg font-semibold tracking-wide">
            {phone}
          </p>
        </div>

        <div className="flex justify-center gap-2" onPaste={onPaste}>
          {otpDigits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              onChange={(e) => onDigitChange(i, e.target.value)}
              onKeyDown={(e) => onDigitKeyDown(i, e)}
              className={cn(
                "h-12 w-10 rounded-control border bg-surface text-center text-xl font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 md:h-14 md:w-12",
                d ? "border-primary text-fg" : "border-border-strong text-fg"
              )}
              aria-label={`Chiffre ${i + 1}`}
            />
          ))}
        </div>

        {info && <p className="text-center text-xs text-info">{info}</p>}
        {error && (
          <p role="alert" className="text-center text-sm font-medium text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || otp.length < 6}
          className={buttonClasses({ size: "lg", fullWidth: true })}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </button>

        <div className="flex flex-col items-center gap-2 text-sm">
          <button
            type="button"
            disabled={resendIn > 0 || pending}
            onClick={() => sendOtp()}
            className="font-medium text-accent-ink hover:underline disabled:text-muted disabled:no-underline"
          >
            {resendIn > 0 ? `Renvoyer dans ${resendIn}s` : "Renvoyer le code"}
          </button>
          <button
            type="button"
            className="text-muted hover:text-fg"
            onClick={() => {
              setStep("phone");
              setOtpDigits(["", "", "", "", "", ""]);
              setError(null);
            }}
          >
            Changer de numéro
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <ShieldCheck className="h-3.5 w-3.5 stroke-[1.5]" />
          Connexion sécurisée · SMS uniquement
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-fg">Numéro de téléphone</span>
        <div className="flex min-h-11 overflow-hidden rounded-control border border-border-strong bg-surface transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 hover:border-fg-secondary/40">
          <span className="flex items-center border-r border-border bg-background px-3 text-sm font-medium text-muted">
            +229
          </span>
          <input
            required
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none md:text-sm"
            placeholder={BJ_PHONE_PLACEHOLDER}
            autoComplete="tel"
          />
        </div>
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ size: "lg", fullWidth: true })}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Continuer
      </button>
      <p className="text-center text-[11px] leading-relaxed text-muted">
        En continuant, tu acceptes de recevoir un code SMS pour te connecter.
        Aucun mot de passe.
      </p>
    </form>
  );
}
