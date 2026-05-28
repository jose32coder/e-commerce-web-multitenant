// ─── Service Worker — Deploy Shop PWA ────────────────────────────────
// Handles push notifications and basic offline caching.
// This file lives in /public so it's served from the root scope (/).

const CACHE_NAME = "deploy-shop-v1";

// ─── Install: pre-cache the app shell ───────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        "/manifest.json",
      ])
    )
  );
  // Activate immediately without waiting for open tabs to close
  self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ─── Fetch: network-first with cache fallback ───────────────────────
self.addEventListener("fetch", (event) => {
  // Only handle GET requests; skip API calls and non-GET
  if (event.request.method !== "GET") return;

  // Skip caching for API routes and Next.js internals
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Push Notifications ─────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data?.json() ?? {};
  } catch {
    data = {
      title: "Deploy Shop",
      body: event.data?.text() ?? "Tienes una nueva notificación",
    };
  }

  const title = data.title || "Deploy Shop";
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: data.icon || "/icons/icon-512x512.png",
    badge: data.badge || "/icons/icon-512x512.png",
    image: data.image || undefined,
    tag: data.tag || "default",
    // Data payload to handle click navigation
    data: {
      url: data.url || "/",
      ...data.data,
    },
    // Vibration pattern for mobile
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click: open/focus the target URL ──────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a tab with that URL is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
