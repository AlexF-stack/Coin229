/**
 * Custom service worker (next-pwa importScripts).
 * Gère Web Push + clic notification.
 */
/* eslint-disable no-undef */

self.addEventListener("push", (event) => {
  /** @type {{ title?: string; body?: string; url?: string; tag?: string }} */
  let data = {
    title: "Coin229",
    body: "Nouveau message Coin229",
    url: "/",
    tag: "coin229",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      const text = event.data?.text?.();
      if (text) data.body = text;
    } catch {
      // ignore
    }
  }

  const title = data.title || "Coin229";
  const options = {
    body: data.body || "",
    icon: "/icons/c2/icon-192.png",
    badge: "/icons/c2/icon-192.png",
    tag: data.tag || "coin229",
    renotify: true,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data?.url || "/";
  const targetUrl = new URL(raw, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientsList) {
        if ("focus" in client && client.url.startsWith(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              // ignore
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
