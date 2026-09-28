/**
 * Webhook ops Coin229 — cible ORDER_NOTIFY_WEBHOOK.
 * Envoie WhatsApp (CallMeBot ou Meta Cloud) + journalise en AppConfig.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.NOTIFY_HOOK_SECRET?.trim();
  if (!secret) return false;
  const url = new URL(request.url);
  const q = url.searchParams.get("key") || url.searchParams.get("secret");
  const header = request.headers.get("x-notify-secret");
  return q === secret || header === secret;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.startsWith("229") ? digits : `229${digits.slice(-8)}`;
}

async function sendCallMeBot(phone: string, text: string) {
  const apiKey = process.env.CALLMEBOT_APIKEY?.trim();
  if (!apiKey) return { ok: false as const, reason: "no_callmebot" };
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  return { ok: res.ok, status: res.status, reason: "callmebot" as const };
}

async function sendMetaWhatsApp(phone: string, text: string) {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return { ok: false as const, reason: "no_meta" };
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text.slice(0, 4000) },
      }),
      signal: AbortSignal.timeout(10000),
    }
  );
  return { ok: res.ok, status: res.status, reason: "meta" as const };
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const type = String(body.type || "unknown");
  const message =
    typeof body.message === "string"
      ? body.message
      : `[Coin229] ${type} — ${JSON.stringify(body).slice(0, 500)}`;

  const adminPhone =
    normalizePhone(process.env.OPS_WHATSAPP_NUMBER || SITE.whatsapp) || null;
  const vendorPhone =
    typeof body.vendorContact === "string"
      ? normalizePhone(body.vendorContact)
      : null;

  const results: unknown[] = [];
  if (adminPhone) {
    const meta = await sendMetaWhatsApp(adminPhone, message);
    if (meta.ok) results.push(meta);
    else {
      const bot = await sendCallMeBot(adminPhone, message);
      results.push(bot);
    }
  }
  if (vendorPhone && type === "order.created") {
    const vendorMsg =
      typeof body.message === "string"
        ? body.message
        : `Nouvelle commande Coin229 — ouvre ${SITE.url}/vendeur/espace/commandes`;
    const meta = await sendMetaWhatsApp(vendorPhone, vendorMsg);
    if (meta.ok) results.push({ vendor: meta });
    else {
      const bot = await sendCallMeBot(vendorPhone, vendorMsg);
      results.push({ vendor: bot });
    }
  }

  try {
    await prisma.appConfig.upsert({
      where: { cle: "LAST_OPS_NOTIFY" },
      update: {
        valeur: JSON.stringify({
          at: new Date().toISOString(),
          type,
          message: message.slice(0, 800),
          results,
        }),
      },
      create: {
        cle: "LAST_OPS_NOTIFY",
        valeur: JSON.stringify({
          at: new Date().toISOString(),
          type,
          message: message.slice(0, 800),
          results,
        }),
      },
    });
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, results });
}
