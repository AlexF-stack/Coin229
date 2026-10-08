import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import {
  createVendorSessionToken,
  hashVendorPassword,
  RESERVED_VENDOR_SLUGS,
  slugifyBoutique,
  vendorCookieName,
  vendorCookieOptions,
} from "@/lib/vendor-auth";
import { SITE } from "@/lib/site";
import { sendPushTo } from "@/lib/push-audience";
import { postOpsWebhook } from "@/lib/ops-webhook";

const registerSchema = z.object({
  nomBoutique: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  contact: z.string().trim().min(8).max(40),
  description: z.string().trim().max(500).optional(),
});

async function notifyAdminNewVendor(input: {
  nomBoutique: string;
  email: string;
  contact: string;
  slug: string | null;
}) {
  const adminUrl = `${SITE.url}/admin/vendeurs`;
  void postOpsWebhook({
    type: "vendor.registered",
    ...input,
    adminUrl,
    message: `Nouveau vendeur Coin229 : ${input.nomBoutique} (${input.email}) — valider : ${adminUrl}`,
  }).catch(() => {});
  try {
    // Admin uniquement — jamais les clients ni les autres vendeurs
    await sendPushTo(
      { roles: ["admin"] },
      {
        title: "Nouveau vendeur Coin229",
        body: `${input.nomBoutique} — à valider`,
        url: "/admin/vendeurs",
        tag: "vendor-register",
      }
    );
  } catch {
    // ignore
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await rateLimitAsync({
    key: `vendor-register:${ip}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.vendor.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "email_taken" }, { status: 409 });
  }

  const base = slugifyBoutique(parsed.data.nomBoutique);
  const withSuffix = () => `${base}-${Math.random().toString(36).slice(2, 6)}`;
  // Nom réservé (page du site) ou déjà pris → suffixe
  let slug =
    RESERVED_VENDOR_SLUGS.has(base) ||
    (await prisma.vendor.findUnique({ where: { slug: base }, select: { id: true } }))
      ? withSuffix()
      : base;

  const passwordHash = hashVendorPassword(parsed.data.password);
  let vendor: Awaited<ReturnType<typeof prisma.vendor.create>> | null = null;
  // Deux inscriptions simultanées au même nom : on réessaie avec un suffixe
  for (let attempt = 0; attempt < 5 && !vendor; attempt++) {
    try {
      vendor = await prisma.vendor.create({
        data: {
          nomBoutique: parsed.data.nomBoutique,
          contact: parsed.data.contact,
          email,
          passwordHash,
          slug,
          description: parsed.data.description || null,
          statut: "en_attente",
        },
      });
    } catch (err) {
      const target = (err as { code?: string; meta?: { target?: unknown } }).code === "P2002"
        ? String((err as { meta?: { target?: unknown } }).meta?.target ?? "")
        : "";
      if (target.includes("email")) {
        return NextResponse.json({ ok: false, error: "email_taken" }, { status: 409 });
      }
      if (!target.includes("slug")) throw err;
      slug = withSuffix();
    }
  }
  if (!vendor) {
    return NextResponse.json({ ok: false, error: "slug_unavailable" }, { status: 409 });
  }

  void notifyAdminNewVendor({
    nomBoutique: vendor.nomBoutique,
    email: vendor.email!,
    contact: vendor.contact,
    slug: vendor.slug,
  });

  const token = createVendorSessionToken(vendor.id);
  const res = NextResponse.json({
    ok: true,
    vendorId: vendor.id,
    statut: vendor.statut,
    slug: vendor.slug,
  });
  if (token) {
    res.cookies.set(vendorCookieName(), token, vendorCookieOptions());
  }
  return res;
}
