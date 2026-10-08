import { safeNextPath } from "@/lib/safe-next";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import {
  createVendorSessionToken,
  vendorCookieName,
  vendorCookieOptions,
  verifyVendorPassword,
} from "@/lib/vendor-auth";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(72),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  const limited = await rateLimitAsync({
    key: `vendor-login:${clientIp(request)}`,
    limit: 20,
    windowMs: 15 * 60 * 1000,
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

  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // Par compte : protège un vendeur visé depuis plusieurs IP
  const perAccount = await rateLimitAsync({
    key: `vendor-login:email:${parsed.data.email.toLowerCase()}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!perAccount.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    omit: { passwordHash: false },
  });
  // Mot de passe toujours vérifié (calcul factice si le compte n'existe pas)
  const passwordOk = verifyVendorPassword(parsed.data.password, vendor?.passwordHash);
  if (!vendor || !passwordOk) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  if (vendor.statut === "suspendu") {
    return NextResponse.json({ ok: false, error: "suspended" }, { status: 403 });
  }

  // Version de session actuelle : un changement de mot de passe la révoquera
  const token = createVendorSessionToken(vendor.id, vendor.sessionVersion);
  if (!token) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    next: safeNextPath(parsed.data.next, "/vendeur/espace", "/vendeur/espace"),
    statut: vendor.statut,
  });
  res.cookies.set(vendorCookieName(), token, vendorCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(vendorCookieName(), "", { ...vendorCookieOptions(0), maxAge: 0 });
  return res;
}
