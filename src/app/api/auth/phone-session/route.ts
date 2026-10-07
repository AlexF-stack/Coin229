import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  allowDemoOtp,
  createPhoneSessionToken,
  normalizeBjPhone,
  phoneCookieName,
  phoneCookieOptions,
  readPhoneFromToken,
} from "@/lib/phone-session";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = await rateLimitAsync({
    key: `phone-session:${ip}`,
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    phone?: string;
    otp?: string;
  } | null;

  const phone = normalizeBjPhone(body?.phone ?? "");
  const otp = (body?.otp ?? "").replace(/\D/g, "");
  if (!phone || otp.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Données invalides" },
      { status: 400 }
    );
  }

  // Par numéro : empêche de deviner un code depuis plusieurs IP
  const perPhone = await rateLimitAsync({
    key: `phone-session:tel:${phone}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!perPhone.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives pour ce numéro. Réessaie dans 15 minutes." },
      { status: 429, headers: { "Retry-After": String(perPhone.retryAfterSec) } }
    );
  }

  let authenticated = false;

  if (allowDemoOtp() && otp === "123456") {
    authenticated = true;
  } else {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });
      authenticated = !error;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    return NextResponse.json(
      { ok: false, error: "Code incorrect" },
      { status: 401 }
    );
  }

  const token = await createPhoneSessionToken(phone);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Session indisponible (secret manquant)" },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true, phone });
  res.cookies.set(phoneCookieName(), token, phoneCookieOptions());
  return res;
}

export async function GET() {
  const jar = await cookies();
  const phone = await readPhoneFromToken(jar.get(phoneCookieName())?.value);
  if (!phone) {
    return NextResponse.json({ phone: null }, { status: 401 });
  }
  return NextResponse.json({ phone });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(phoneCookieName(), "", {
    ...phoneCookieOptions(0),
    maxAge: 0,
  });
  return res;
}
