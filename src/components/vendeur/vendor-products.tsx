"use client";

import { useRef, useState, useTransition } from "react";
import type { Genre, Product, ProductStatus } from "@prisma/client";
import { upsertVendorProduct } from "@/lib/vendor-actions";
import {
  GENRE_LABELS,
  VENDOR_NICHE_OPTIONS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ImagePlus, Loader2, Pencil, Plus, X } from "lucide-react";

type Props = {
  products: Product[];
  canPublish: boolean;
};

const emptyForm = {
  nom: "",
  description: "",
  niche: VENDOR_NICHE_OPTIONS[0]!.value,
  genre: "unisexe" as Genre,
  prix: 10000,
  prixPromo: "" as string | number,
  stockQuantite: 5,
  images: [] as string[],
  statut: "actif" as ProductStatus,
};

const field =
  "w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50";

export function VendorProducts({ products, canPublish }: Props) {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [form, setForm] = useState(emptyForm);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function startCreate() {
    setEditId(undefined);
    setForm(emptyForm);
    setAdvanced(false);
    setOpen(true);
    setMessage(null);
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    const niche =
      VENDOR_NICHE_OPTIONS.find((o) => o.value === p.niche)?.value ||
      VENDOR_NICHE_OPTIONS.find((o) => o.categorie === p.categorie)?.value ||
      VENDOR_NICHE_OPTIONS[0]!.value;
    setForm({
      nom: p.nom,
      description: p.description,
      niche,
      genre: p.genre,
      prix: p.prix,
      prixPromo: p.prixPromo ?? "",
      stockQuantite: p.stockQuantite,
      images: p.images ?? [],
      statut: p.statut,
    });
    setAdvanced(Boolean(p.prixPromo) || p.genre !== "unisexe");
    setOpen(true);
    setMessage(null);
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMessage(null);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/vendor/upload", {
          method: "POST",
          body,
        });
        const json = (await res.json()) as {
          ok?: boolean;
          url?: string;
          error?: string;
          hint?: string;
        };
        if (!res.ok || !json.ok || !json.url) {
          throw new Error(json.hint || json.error || "Upload échoué");
        }
        urls.push(json.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 8) }));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (form.images.length === 0) {
      setMessage("Ajoute au moins une photo.");
      return;
    }
    startTransition(async () => {
      const res = await upsertVendorProduct({
        id: editId,
        nom: form.nom,
        description: form.description || form.nom,
        niche: form.niche,
        genre: form.genre,
        prix: Number(form.prix),
        prixPromo: form.prixPromo === "" ? null : Number(form.prixPromo),
        stockQuantite: Number(form.stockQuantite),
        images: form.images,
        statut: form.statut,
      });

      if (!res.success) {
        setMessage(res.error ?? "Erreur");
        return;
      }
      setMessage(editId ? "Produit mis à jour" : "Produit publié");
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      {!canPublish && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Compte en attente de validation Coin229 — tu peux préparer tes
          produits ; la vitrine s’ouvrira après activation.
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">{products.length} produit(s)</p>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-[#0c0d12] hover:bg-amber-400"
        >
          <Plus className="h-4 w-4 stroke-[1.5]" />
          Ajouter
        </button>
      </div>

      {open && (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-xl border border-white/10 bg-[#1a1c24] p-4"
        >
          <h3 className="font-semibold text-white">
            {editId ? "Modifier le produit" : "Nouveau produit"}
          </h3>
          <p className="text-xs text-white/40">
            Photo → nom → prix → niche. C’est tout pour publier.
          </p>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
            />
            <button
              type="button"
              disabled={uploading || form.images.length >= 8}
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-[#0c0d12] px-3 py-6 text-sm text-white/70 hover:border-amber-500/40 hover:text-amber-200 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              {uploading ? "Envoi…" : "Ajouter des photos"}
            </button>
            {form.images.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {form.images.map((src) => (
                  <li key={src} className="relative h-16 w-16 overflow-hidden rounded-md border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Retirer"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          images: f.images.filter((u) => u !== src),
                        }))
                      }
                      className="absolute right-0.5 top-0.5 rounded bg-black/70 p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input
            required
            placeholder="Nom du produit"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className={field}
          />
          <textarea
            placeholder="Description courte (optionnel)"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${field} resize-none`}
          />
          <select
            required
            value={form.niche}
            onChange={(e) => setForm({ ...form, niche: e.target.value })}
            className={field}
          >
            {VENDOR_NICHE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              required
              min={0}
              placeholder="Prix (FCFA)"
              value={form.prix}
              onChange={(e) =>
                setForm({ ...form, prix: Number(e.target.value) })
              }
              className={field}
            />
            <input
              type="number"
              required
              min={0}
              placeholder="Stock"
              value={form.stockQuantite}
              onChange={(e) =>
                setForm({ ...form, stockQuantite: Number(e.target.value) })
              }
              className={field}
            />
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
          >
            {advanced ? "Masquer les options" : "Options (promo, genre…)"}
          </button>

          {advanced && (
            <div className="space-y-2 rounded-lg border border-white/5 bg-black/20 p-3">
              <input
                type="number"
                min={0}
                placeholder="Prix promo (optionnel)"
                value={form.prixPromo}
                onChange={(e) =>
                  setForm({ ...form, prixPromo: e.target.value })
                }
                className={field}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.genre}
                  onChange={(e) =>
                    setForm({ ...form, genre: e.target.value as Genre })
                  }
                  className={field}
                >
                  {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
                    <option key={g} value={g}>
                      {GENRE_LABELS[g]}
                    </option>
                  ))}
                </select>
                <select
                  value={form.statut}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      statut: e.target.value as ProductStatus,
                    })
                  }
                  className={field}
                >
                  <option value="actif">Actif</option>
                  <option value="rupture">Rupture</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>
            </div>
          )}

          {message && <p className="text-sm text-amber-300">{message}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || uploading}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-[#0c0d12] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#1a1c24]">
        {products.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {p.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.images[0]}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded bg-white/5" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{p.nom}</p>
                <p className="text-xs text-white/45">
                  {p.niche || "—"} · {formatPrice(p.prix)} · stock{" "}
                  {p.stockQuantite}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startEdit(p)}
              className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5 hover:text-white"
              aria-label="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </li>
        ))}
        {products.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-white/45">
            Aucun produit — clique sur Ajouter pour commencer.
          </li>
        )}
      </ul>
    </div>
  );
}
