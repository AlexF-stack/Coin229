import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

const schema = z.object({
  email: z.string().trim().email().max(120),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function waLink(contact: string, text: string): string | null {
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const phone = digits.startsWith("229") ? digits : `229${digits.slice(-8)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const limited = await rateLimitAsync({
    key: `vendor-forgot:${ip}`,
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
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const vendor = await prisma.vendor.findUnique({ where: { email } });

  if (!vendor?.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      resetTokenHash: hashToken(token),
      resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${SITE.url}/vendeur/reinitialiser?token=${token}`;
  const message = `Réinitialise ton mot de passe Coin229 vendeur : ${resetUrl}`;
  const hook = process.env.ORDER_NOTIFY_WEBHOOK?.trim();
  if (hook) {
    void fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "vendor.password_reset",
        email,
        boutique: vendor.nomBoutique,
        resetUrl,
        whatsappVendor: waLink(vendor.contact, message),
        message,
      }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  }

  const payload: { ok: true; resetUrl?: string } = { ok: true };
  if (process.env.NODE_ENV !== "production") {
    payload.resetUrl = resetUrl;
  }
  return NextResponse.json(payload);
}
