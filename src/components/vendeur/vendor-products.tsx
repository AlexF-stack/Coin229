"use client";

import { useRef, useState, useTransition } from "react";
import type { Genre, Product, ProductStatus } from "@prisma/client";
import { upsertVendorProduct } from "@/lib/vendor-actions";
import {
  GENRE_LABELS,
  VENDOR_NICHE_OPTIONS,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { ChevronDown, ImagePlus, Loader2, Package, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/overlay";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

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
      setOpen(false);
      window.location.reload();
    });
  }

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const nicheLabel = (value: string) => VENDOR_NICHE_OPTIONS.find((o) => o.value === value)?.label ?? (value || "—");

  return (
    <div className="space-y-4">
      {!canPublish && (
        <Alert tone="warning" title="Compte en attente de validation Coin229">
          Tu peux déjà préparer tes produits ; ta vitrine s’ouvrira après activation.
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{products.length} produit(s)</p>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <DataTable
        caption="Mes produits"
        rows={products}
        rowKey={(p) => p.id}
        empty={
          <EmptyState
            icon={<Package />}
            title="Aucun produit"
            description="Photo, nom, prix : quelques secondes pour apparaître dans la boutique."
            action={
              <Button size="sm" onClick={startCreate}>
                <Plus className="h-4 w-4" /> Ajouter un produit
              </Button>
            }
          />
        }
        columns={[
          {
            key: "produit",
            header: "Produit",
            primary: true,
            cell: (p) => (
              <span className="flex min-w-0 items-center gap-3">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-control object-cover" />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded-control bg-background" />
                )}
                <span className="min-w-0 font-medium">{p.nom}</span>
              </span>
            ),
          },
          { key: "niche", header: "Collection", cell: (p) => nicheLabel(p.niche) },
          { key: "prix", header: "Prix", align: "right", cell: (p) => formatPrice(p.prixPromo ?? p.prix) },
          { key: "stock", header: "Stock", align: "right", cell: (p) => p.stockQuantite },
          { key: "statut", header: "Statut", cell: (p) => <StatusBadge kind="product" status={p.statut} /> },
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            actions: true,
            align: "right",
            cell: (p) => (
              <Button size="sm" variant="outline" onClick={() => startEdit(p)} aria-label={`Modifier ${p.nom}`}>
                <Pencil className="h-4 w-4" />
                <span className="md:sr-only">Modifier</span>
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le produit" : "Nouveau produit"}
        description="Photo → nom → prix → collection. C’est tout pour publier."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" form="vendor-product-form" loading={pending} disabled={uploading}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="vendor-product-form" onSubmit={onSubmit} className="space-y-4">
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
              className="flex w-full items-center justify-center gap-2 rounded-control border border-dashed border-border-strong bg-surface-muted px-3 py-6 text-sm font-medium text-fg-secondary transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              {uploading ? "Envoi…" : "Ajouter des photos (8 max)"}
            </button>
            {form.images.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {form.images.map((src) => (
                  <li key={src} className="relative h-16 w-16 overflow-hidden rounded-control border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Retirer la photo"
                      onClick={() => setForm((f) => ({ ...f, images: f.images.filter((u) => u !== src) }))}
                      className="absolute right-0.5 top-0.5 rounded-full bg-surface/90 p-1 text-fg shadow-card hover:text-error"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Field label="Nom du produit" required>
            <Input value={form.nom} onChange={(e) => set({ nom: e.target.value })} />
          </Field>
          <Field label="Description courte" hint="Optionnel">
            <Textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="Collection" required>
            <Select value={form.niche} onChange={(e) => set({ niche: e.target.value })}>
              {VENDOR_NICHE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (FCFA)" required>
              <Input type="number" min={0} value={form.prix} onChange={(e) => set({ prix: Number(e.target.value) })} />
            </Field>
            <Field label="Stock" required>
              <Input
                type="number"
                min={0}
                value={form.stockQuantite}
                onChange={(e) => set({ stockQuantite: Number(e.target.value) })}
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            aria-expanded={advanced}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Options (promo, public, statut)
            <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} />
          </button>

          {advanced && (
            <div className="space-y-4 rounded-card bg-surface-muted p-4">
              <Field label="Prix promo" hint="Vide = pas de promo">
                <Input type="number" min={0} value={form.prixPromo} onChange={(e) => set({ prixPromo: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Public">
                  <Select value={form.genre} onChange={(e) => set({ genre: e.target.value as Genre })}>
                    {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
                      <option key={g} value={g}>
                        {GENRE_LABELS[g]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Statut">
                  <Select value={form.statut} onChange={(e) => set({ statut: e.target.value as ProductStatus })}>
                    <option value="actif">En vente</option>
                    <option value="rupture">Épuisé</option>
                    <option value="archive">Retiré</option>
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {message && <Alert tone="error">{message}</Alert>}
        </form>
      </Drawer>
    </div>
  );
}
