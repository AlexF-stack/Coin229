import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { clientIp, rateLimitAll } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin non configuré : ADMIN_PASSWORD (min. 8 car.) et ADMIN_SESSION_SECRET (min. 16 car., distinct des autres secrets, pas de valeur d’exemple).",
      },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  // Par IP + global : un seul compte admin, une attaque répartie sur
  // plusieurs IP reste plafonnée
  const limited = await rateLimitAll([
    { key: `admin-login:${ip}`, limit: 8, windowMs: 15 * 60 * 1000 },
    { key: "admin-login:global", limit: 30, windowMs: 60 * 60 * 1000 },
  ]);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives. Réessaie plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;

  if (!body?.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), token, adminCookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), "", {
    ...adminCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
