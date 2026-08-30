import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
  );
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_KEYS_MISSING");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@coin229.bj",
    publicKey,
    privateKey
  );
}

export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  configureWebPush();
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
      tag: payload.tag || "coin229",
    })
  );
}

/** Codes HTTP = abonnement mort → à purger. */
export function isGonePushError(err: unknown): boolean {
  const status =
    err && typeof err === "object" && "statusCode" in err
      ? Number((err as { statusCode?: number }).statusCode)
      : NaN;
  return status === 404 || status === 410;
}
