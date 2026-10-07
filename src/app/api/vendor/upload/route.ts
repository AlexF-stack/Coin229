/**
 * Upload photo produit vendeur → Supabase Storage (clé serveur) en production,
 * /public/uploads en développement uniquement.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { assertVendor } from "@/lib/assert-vendor";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 4.5 * 1024 * 1024; // ~4.5 Mo (limite soft Vercel)

/** Session vendeur valide (version de session vérifiée, compte non suspendu) */
async function requireVendorId(): Promise<string | null> {
  const session = await assertVendor();
  return session.ok ? session.vendorId : null;
}

export async function POST(request: Request) {
  const vendorId = await requireVendorId();
  if (!vendorId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limited = await rateLimitAsync({
    key: `vendor-upload:${vendorId}`,
    limit: 40,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "missing_file", hint: "Aucun fichier reçu." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "fichier_trop_lourd", hint: "Photo trop lourde (4,5 Mo maximum)." },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Type réel lu dans le contenu du fichier (pas celui annoncé par le navigateur)
  const kind = detectImageKind(buf);
  if (!kind) {
    return NextResponse.json(
      { ok: false, error: "type_interdit", hint: "Format non accepté : JPEG, PNG ou WebP uniquement." },
      { status: 400 }
    );
  }
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${kind.ext}`;
  const objectPath = `vendors/${vendorId}/${name}`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const isProd = process.env.NODE_ENV === "production";

  // Production : stockage Supabase avec la clé serveur uniquement (jamais la
  // clé publique, jamais le disque de Vercel qui est éphémère)
  if (isSupabaseConfigured() && serviceKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bucket =
      process.env.SUPABASE_PRODUCT_BUCKET?.trim() || "coin229-product-images";
    const { error } = await admin.storage.from(bucket).upload(objectPath, buf, {
      contentType: kind.mime,
      upsert: false,
    });
    if (error) {
      console.error("[vendor-upload] stockage Supabase :", error.message);
      return NextResponse.json(
        { ok: false, error: "storage_failed", hint: "L’envoi de la photo a échoué. Réessaie dans un instant." },
        { status: 502 }
      );
    }
    const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
    return NextResponse.json({ ok: true, url: data.publicUrl });
  }

  if (isProd) {
    console.error("[vendor-upload] SUPABASE_SERVICE_ROLE_KEY / Supabase non configuré en production");
    return NextResponse.json(
      {
        ok: false,
        error: "upload_not_configured",
        hint: "L’envoi de photos n’est pas encore configuré. Contacte Coin229.",
      },
      { status: 503 }
    );
  }

  // Développement uniquement : enregistrement local
  const dir = path.join(process.cwd(), "public", "uploads", "vendors", vendorId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return NextResponse.json({
    ok: true,
    url: `/uploads/vendors/${vendorId}/${name}`,
  });
}

/** Signature binaire des formats acceptés */
function detectImageKind(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}
