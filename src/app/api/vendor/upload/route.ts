/**
 * Upload photo produit vendeur → Supabase Storage (prod) ou /public/uploads (dev).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  readVendorSessionToken,
  vendorCookieName,
} from "@/lib/vendor-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_BYTES = 4.5 * 1024 * 1024; // ~4.5 Mo (limite soft Vercel)
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

async function requireVendorId(): Promise<string | null> {
  const jar = await cookies();
  const vendorId = readVendorSessionToken(jar.get(vendorCookieName())?.value);
  if (!vendorId) return null;
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, statut: true },
  });
  if (!vendor || vendor.statut === "suspendu") return null;
  return vendor.id;
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
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: "type_interdit", hint: "JPEG, PNG ou WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "fichier_trop_lourd", hint: "Max 4,5 Mo" },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const objectPath = `vendors/${vendorId}/${name}`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const storageKey = serviceKey || anonKey;

  if (isSupabaseConfigured() && storageKey && supabaseUrl) {
    const admin = createClient(supabaseUrl, storageKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const bucket =
      process.env.SUPABASE_PRODUCT_BUCKET?.trim() || "coin229-product-images";
    const { error } = await admin.storage.from(bucket).upload(objectPath, buf, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return NextResponse.json(
        { ok: false, error: "storage_failed", detail: error.message },
        { status: 502 }
      );
    }
    const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
    return NextResponse.json({
      ok: true,
      url: data.publicUrl,
      via: serviceKey ? "service_role" : "anon",
    });
  }

  // Dev / fallback local (éphémère sur Vercel — préférer Supabase en prod)
  const dir = path.join(process.cwd(), "public", "uploads", "vendors", vendorId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return NextResponse.json({
    ok: true,
    url: `/uploads/vendors/${vendorId}/${name}`,
    warning: process.env.VERCEL
      ? "storage_ephemere_configurer_supabase"
      : undefined,
  });
}
