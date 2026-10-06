import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync } from "@/lib/rate-limit";
import {
  createVendorSessionToken,
  hashVendorPassword,
  slugifyBoutique,
  vendorCookieName,
  vendorCookieOptions,
} from "@/lib/vendor-auth";
import { SITE } from "@/lib/site";
import { sendPushTo } from "@/lib/push-audience";

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
  const hook = process.env.ORDER_NOTIFY_WEBHOOK?.trim();
  const adminUrl = `${SITE.url}/admin/vendeurs`;
  if (hook) {
    void fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "vendor.registered",
        ...input,
        adminUrl,
        message: `Nouveau vendeur Coin229 : ${input.nomBoutique} (${input.email}) — valider : ${adminUrl}`,
      }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  }
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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
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

  let slug = slugifyBoutique(parsed.data.nomBoutique);
  const slugTaken = await prisma.vendor.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const vendor = await prisma.vendor.create({
    data: {
      nomBoutique: parsed.data.nomBoutique,
      contact: parsed.data.contact,
      email,
      passwordHash: hashVendorPassword(parsed.data.password),
      slug,
      description: parsed.data.description || null,
      statut: "en_attente",
    },
  });

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
