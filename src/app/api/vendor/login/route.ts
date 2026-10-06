import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  createVendorSessionToken,
  safeVendorNext,
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
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const limited = rateLimit({
    key: `vendor-login:${ip}`,
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

  const vendor = await prisma.vendor.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    omit: { passwordHash: false },
  });
  if (
    !vendor ||
    !verifyVendorPassword(parsed.data.password, vendor.passwordHash)
  ) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  if (vendor.statut === "suspendu") {
    return NextResponse.json({ ok: false, error: "suspended" }, { status: 403 });
  }

  const token = createVendorSessionToken(vendor.id);
  if (!token) {
    return NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    next: safeVendorNext(parsed.data.next),
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
