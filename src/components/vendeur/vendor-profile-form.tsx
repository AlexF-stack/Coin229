"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { SafeVendor } from "@/lib/constants";
import { updateMyVendorProfile } from "@/lib/vendor-actions";
import { ImagePlus, Loader2 } from "lucide-react";

type Props = {
  vendor: SafeVendor;
};

const field =
  "w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50";

export function VendorProfileForm({ vendor }: Props) {
  const [description, setDescription] = useState(vendor.description ?? "");
  const [contact, setContact] = useState(vendor.contact);
  const [logoUrl, setLogoUrl] = useState(vendor.logoUrl ?? "");
  const [ifu, setIfu] = useState(vendor.ifu ?? "");
  const [rccm, setRccm] = useState(vendor.rccm ?? "");
  const [mobileMoney, setMobileMoney] = useState(vendor.mobileMoney ?? "");
  const [acceptTerms, setAcceptTerms] = useState(Boolean(vendor.termsAcceptedAt));
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/vendor/upload", { method: "POST", body });
      const data = (await res.json()) as { ok?: boolean; url?: string };
      if (!res.ok || !data.url) {
        setMessage("Échec upload logo.");
        return;
      }
      setLogoUrl(data.url);
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (acceptTerms && !vendor.termsAcceptedAt) {
      /* ok — will set termsAcceptedAt */
    }
    startTransition(async () => {
      const res = await updateMyVendorProfile({
        description,
        contact,
        logoUrl: logoUrl.trim() || null,
        ifu: ifu.trim() || null,
        rccm: rccm.trim() || null,
        mobileMoney: mobileMoney.trim() || null,
        acceptTerms: acceptTerms && !vendor.termsAcceptedAt,
      });
      if (res.success) {
        setMessage("Profil enregistré.");
      } else {
        setMessage("Erreur lors de l’enregistrement.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <label className="block space-y-1.5 text-sm">
        <span className="text-white/45">Description boutique</span>
        <textarea
          rows={4}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${field} resize-none`}
          placeholder="Présente ta marque…"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-white/45">Contact (WhatsApp / téléphone)</span>
        <input
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className={field}
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm text-white/45">Logo</span>
        <div className="flex flex-wrap items-center gap-3">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-14 w-14 rounded-lg border border-white/10 object-cover"
            />
          )}
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className={`${field} min-w-[200px] flex-1`}
            placeholder="URL ou upload"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onPickLogo(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            Upload
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">IFU (optionnel)</span>
          <input
            value={ifu}
            onChange={(e) => setIfu(e.target.value)}
            className={field}
            placeholder="Identifiant fiscal"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">RCCM (optionnel)</span>
          <input
            value={rccm}
            onChange={(e) => setRccm(e.target.value)}
            className={field}
            placeholder="Registre commerce"
          />
        </label>
      </div>

      <label className="block space-y-1.5 text-sm">
        <span className="text-white/45">Mobile Money (reversements)</span>
        <input
          value={mobileMoney}
          onChange={(e) => setMobileMoney(e.target.value)}
          className={field}
          placeholder="+229 … ou numéro MoMo"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-white/60">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          disabled={Boolean(vendor.termsAcceptedAt)}
          className="mt-1 rounded border-white/20"
        />
        <span>
          J&apos;accepte les{" "}
          <Link href="/cgv" target="_blank" className="text-amber-300 hover:underline">
            conditions générales
          </Link>{" "}
          vendeur Coin229.
          {vendor.termsAcceptedAt && (
            <span className="mt-1 block text-xs text-white/35">
              Accepté le{" "}
              {new Date(vendor.termsAcceptedAt).toLocaleDateString("fr-FR")}
            </span>
          )}
        </span>
      </label>

      {message && (
        <p
          className={`text-sm ${message.includes("Erreur") ? "text-red-400" : "text-emerald-400"}`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-[#0c0d12] disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer le profil
      </button>
    </form>
  );
}
