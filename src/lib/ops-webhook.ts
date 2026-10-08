import { SITE } from "@/lib/site";

/**
 * Alerte « ops » vers ORDER_NOTIFY_WEBHOOK (Make, n8n… ou /api/ops/notify).
 * Le secret NOTIFY_HOOK_SECRET part dans un en-tête — jamais dans l'URL — et
 * seulement si le webhook est sur ce site (pas chez un service tiers).
 */
export async function postOpsWebhook(payload: Record<string, unknown>): Promise<void> {
  const hook = process.env.ORDER_NOTIFY_WEBHOOK?.trim();
  if (!hook) return;
  const secret = process.env.NOTIFY_HOOK_SECRET?.trim();
  let sameSite = false;
  try {
    sameSite = new URL(hook).origin === new URL(SITE.url).origin;
  } catch {
    return;
  }
  await fetch(hook, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret && sameSite ? { "x-notify-secret": secret } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
}
