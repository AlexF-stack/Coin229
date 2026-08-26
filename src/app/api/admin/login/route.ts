import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ADMIN_PASSWORD non configuré (min. 8 car., pas de valeur d’exemple).",
      },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const limited = rateLimit({
    key: `admin-login:${ip}`,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
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
