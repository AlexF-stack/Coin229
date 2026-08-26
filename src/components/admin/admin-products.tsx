"use client";

import { useState, useTransition } from "react";
import type {
  Categorie,
  Genre,
  Product,
  ProductSource,
  ProductStatus,
} from "@prisma/client";
import { upsertProduct } from "@/lib/actions";
import { CATEGORIE_LABELS, GENRE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Loader2, Pencil, Plus } from "lucide-react";

type Props = {
  products: Product[];
  vendorId: string;
};

const emptyForm = {
  nom: "",
  description: "",
  categorie: "montre" as Categorie,
  genre: "unisexe" as Genre,
  prix: 15000,
  prixPromo: "" as string | number,
  stockQuantite: 10,
  source: "local" as ProductSource,
  images: "",
  statut: "actif" as ProductStatus,
};

const field =
  "w-full rounded-lg border border-white/10 bg-[#0a0b0f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50";

export function AdminProducts({ products, vendorId }: Props) {
  const [list] = useState(products);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [form, setForm] = useState(emptyForm);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function startCreate() {
    setEditId(undefined);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setForm({
      nom: p.nom,
      description: p.description,
      categorie: p.categorie,
      genre: p.genre,
      prix: p.prix,
      prixPromo: p.prixPromo ?? "",
      stockQuantite: p.stockQuantite,
      source: p.source,
      images: p.images.join("\n"),
      statut: p.statut,
    });
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const images = form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await upsertProduct(vendorId, {
        id: editId,
        nom: form.nom,
        description: form.description,
        categorie: form.categorie,
        genre: form.genre,
        prix: Number(form.prix),
        prixPromo: form.prixPromo === "" ? null : Number(form.prixPromo),
        stockQuantite: Number(form.stockQuantite),
        source: form.source,
        images:
          images.length > 0
            ? images
            : [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
              ],
        statut: form.statut,
      });

      if (!res.success) {
        setMessage(res.error ?? "Erreur");
        return;
      }
      setMessage(editId ? "Produit mis à jour" : "Produit créé");
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">{list.length} produit(s)</p>
        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0a0b0f] hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4 stroke-[1.5]" />
          Ajouter
        </button>
      </div>

      {open && (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-xl border border-white/10 bg-[#161920] p-4"
        >
          <h3 className="font-semibold text-white">
            {editId ? "Modifier" : "Nouveau produit"}
          </h3>
          <input
            required
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className={field}
          />
          <textarea
            required
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${field} resize-none`}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.categorie}
              onChange={(e) =>
                setForm({ ...form, categorie: e.target.value as Categorie })
              }
              className={field}
            >
              {(Object.keys(CATEGORIE_LABELS) as Categorie[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIE_LABELS[c]}
                </option>
              ))}
            </select>
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              type="number"
              min={0}
              placeholder="Prix"
              value={form.prix}
              onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })}
              className={field}
            />
            <input
              type="number"
              min={0}
              placeholder="Prix promo"
              value={form.prixPromo}
              onChange={(e) => setForm({ ...form, prixPromo: e.target.value })}
              className={field}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              type="number"
              min={0}
              placeholder="Stock"
              value={form.stockQuantite}
              onChange={(e) =>
                setForm({ ...form, stockQuantite: Number(e.target.value) })
              }
              className={field}
            />
            <select
              value={form.source}
              onChange={(e) =>
                setForm({ ...form, source: e.target.value as ProductSource })
              }
              className={field}
            >
              <option value="local">Local</option>
              <option value="chine">Chine</option>
            </select>
          </div>
          <select
            value={form.statut}
            onChange={(e) =>
              setForm({ ...form, statut: e.target.value as ProductStatus })
            }
            className={field}
          >
            <option value="actif">Actif</option>
            <option value="rupture">Rupture</option>
            <option value="archive">Archivé</option>
          </select>
          <textarea
            placeholder="URLs images (une par ligne)"
            rows={2}
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            className={`${field} resize-none`}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-[#0a0b0f] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50"
            >
              Annuler
            </button>
          </div>
          {message && <p className="text-sm text-emerald-400">{message}</p>}
        </form>
      )}

      <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-[#161920]">
        {list.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{p.nom}</p>
              <p className="text-xs text-white/40">
                Stock {p.stockQuantite} · {formatPrice(p.prixPromo ?? p.prix)} ·{" "}
                {p.source}
              </p>
            </div>
            <button
              type="button"
              onClick={() => startEdit(p)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:bg-white/5 hover:text-white"
              aria-label="Modifier"
            >
              <Pencil className="h-4 w-4 stroke-[1.5]" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
