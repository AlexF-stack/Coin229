import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import type { PushRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveSessionClientId } from "@/lib/push-session";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/web-push";
import { adminCookieName, verifyAdminSessionToken } from "@/lib/admin-auth";
import { assertVendor } from "@/lib/assert-vendor";

const audienceSchema = z.enum(["client", "admin", "vendor"]).default("client");

const bodySchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
  audience: audienceSchema,
});

const deleteSchema = z.object({
  endpoint: z.string().url().max(2048),
  audience: audienceSchema,
});

/**
 * Vérifie que la session a le droit de s'abonner à ce public :
 * admin → cookie admin valide ; vendor → session vendeur active.
 */
async function resolveAudience(
  audience: PushRole
): Promise<{ role: PushRole; vendorId: string | null } | null> {
  const jar = await cookies();
  if (audience === "admin") {
    const ok = await verifyAdminSessionToken(jar.get(adminCookieName())?.value);
    return ok ? { role: "admin", vendorId: null } : null;
  }
  if (audience === "vendor") {
    // Session vérifiée (version de session, compte non suspendu)
    const session = await assertVendor();
    return session.ok ? { role: "vendor", vendorId: session.vendorId } : null;
  }
  return { role: "client", vendorId: null };
}

export async function GET(request: Request) {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { ok: false, error: "push_disabled" },
      { status: 503 }
    );
  }
  // Optionnel : état de l'abonnement de cet appareil pour un public donné
  const url = new URL(request.url);
  const endpoint = url.searchParams.get("endpoint");
  const audience = audienceSchema.safeParse(
    url.searchParams.get("audience") ?? undefined
  );
  let subscribed: boolean | undefined;
  if (endpoint && audience.success) {
    const found = await prisma.pushSubscription.findUnique({
      where: { endpoint_role: { endpoint, role: audience.data } },
      select: { id: true },
    });
    subscribed = Boolean(found);
  }
  return NextResponse.json({
    ok: true,
    publicKey: getVapidPublicKey(),
    ...(subscribed !== undefined ? { subscribed } : {}),
  });
}

export async function POST(request: Request) {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { ok: false, error: "push_disabled" },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const target = await resolveAudience(parsed.data.audience);
  if (!target) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const clientId =
    target.role === "client" ? await resolveSessionClientId() : null;
  const ua = request.headers.get("user-agent")?.slice(0, 300) || null;

  await prisma.pushSubscription.upsert({
    where: {
      endpoint_role: { endpoint: parsed.data.endpoint, role: target.role },
    },
    create: {
      endpoint: parsed.data.endpoint,
      role: target.role,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: ua,
      clientId,
      vendorId: target.vendorId,
    },
    update: {
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: ua,
      vendorId: target.vendorId,
      ...(clientId ? { clientId } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "missing_endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, role: parsed.data.audience },
  });
  return NextResponse.json({ ok: true });
}
