import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveSessionClientId } from "@/lib/push-session";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/web-push";

const bodySchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export async function GET() {
  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { ok: false, error: "push_disabled" },
      { status: 503 }
    );
  }
  return NextResponse.json({
    ok: true,
    publicKey: getVapidPublicKey(),
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

  const clientId = await resolveSessionClientId();
  const ua = request.headers.get("user-agent")?.slice(0, 300) || null;

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: ua,
      clientId,
    },
    update: {
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent: ua,
      ...(clientId ? { clientId } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  let endpoint: string | undefined;
  try {
    const json = (await request.json()) as { endpoint?: string };
    endpoint = json.endpoint;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json({ ok: false, error: "missing_endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
