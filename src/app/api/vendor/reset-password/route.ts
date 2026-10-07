import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync } from "@/lib/rate-limit";
import { hashResetToken as hashToken, hashVendorPassword } from "@/lib/vendor-auth";

const schema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const limited = await rateLimitAsync({
    key: `vendor-reset:${ip}`,
    limit: 12,
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

  const tokenHash = hashToken(parsed.data.token);
  const vendor = await prisma.vendor.findFirst({
    where: {
      resetTokenHash: tokenHash,
      resetTokenExpires: { gt: new Date() },
    },
  });
  if (!vendor) {
    return NextResponse.json(
      { ok: false, error: "token_invalid" },
      { status: 400 }
    );
  }

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      passwordHash: hashVendorPassword(parsed.data.password),
      resetTokenHash: null,
      resetTokenExpires: null,
      resetRequestedAt: null,
      // Déconnecte toutes les sessions ouvertes avec l'ancien mot de passe
      sessionVersion: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true });
}
