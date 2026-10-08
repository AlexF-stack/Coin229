"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { SafeVendor } from "@/lib/constants";
import { updateMyVendorProfile } from "@/lib/vendor-actions";
import { ImagePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Props = {
  vendor: SafeVendor;
};

export function VendorProfileForm({ vendor }: Props) {
  const [description, setDescription] = useState(vendor.description ?? "");
  const [contact, setContact] = useState(vendor.contact);
  const [logoUrl, setLogoUrl] = useState(vendor.logoUrl ?? "");
  const [ifu, setIfu] = useState(vendor.ifu ?? "");
  const [rccm, setRccm] = useState(vendor.rccm ?? "");
  const [mobileMoney, setMobileMoney] = useState(vendor.mobileMoney ?? "");
  const [acceptTerms, setAcceptTerms] = useState(Boolean(vendor.termsAcceptedAt));
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
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
        setMessage({ tone: "error", text: "Échec de l’envoi du logo. Réessaie avec une image JPEG, PNG ou WebP." });
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
        setMessage({ tone: "success", text: "Profil enregistré." });
      } else {
        setMessage({ tone: "error", text: "error" in res ? res.error : "Erreur lors de l’enregistrement." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <Card as="section" className="space-y-4">
        <h2 className="font-display text-base font-semibold text-fg">Vitrine</h2>
        <Field label="Description boutique" hint="500 caractères maximum">
          <Textarea
            rows={4}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Présente ta marque…"
          />
        </Field>
        <Field label="Contact (WhatsApp / téléphone)" required>
          <Input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} />
        </Field>
        <Field label="Logo" hint="Adresse d’une image, ou envoie un fichier">
          <div className="flex flex-wrap items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-14 w-14 rounded-control border border-border object-cover" />
            )}
            <Input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="min-w-[200px] flex-1"
              placeholder="https://…"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onPickLogo(e.target.files)}
            />
            <Button variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
              {!uploading && <ImagePlus className="h-4 w-4" />}
              Envoyer
            </Button>
          </div>
        </Field>
      </Card>

      <Card as="section" className="space-y-4">
        <h2 className="font-display text-base font-semibold text-fg">Fiscalité et reversements</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="IFU" hint="Identifiant fiscal unique">
            <Input value={ifu} onChange={(e) => setIfu(e.target.value)} />
          </Field>
          <Field label="RCCM" hint="Registre du commerce">
            <Input value={rccm} onChange={(e) => setRccm(e.target.value)} />
          </Field>
        </div>
        <Field label="Mobile Money (reversements)" hint="Numéro sur lequel Coin229 te reverse tes ventes">
          <Input type="tel" value={mobileMoney} onChange={(e) => setMobileMoney(e.target.value)} placeholder="01 97 00 00 00" />
        </Field>
        <Checkbox
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          disabled={Boolean(vendor.termsAcceptedAt)}
          label={
            <>
              J&apos;accepte les{" "}
              <Link href="/cgv" target="_blank" className="font-medium text-accent-ink hover:underline">
                conditions générales
              </Link>{" "}
              vendeur Coin229.
            </>
          }
          description={
            vendor.termsAcceptedAt
              ? `Accepté le ${new Date(vendor.termsAcceptedAt).toLocaleDateString("fr-FR")}`
              : undefined
          }
        />
      </Card>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <Button type="submit" loading={pending} disabled={uploading}>
        Enregistrer le profil
      </Button>
    </form>
  );
}
