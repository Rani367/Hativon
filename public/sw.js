// The old app installed a service worker that served articles from a cache for
// up to 30 minutes. This replacement removes itself and that cache from every
// browser that still has it. Keep it at this path for at least a year.
//
// Only article tabs reload, so a writer in a dashboard tab isn't interrupted.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("hativon-"))
          .map((key) => caches.delete(key)),
      );
      await self.registration.unregister();

      const windows = await self.clients.matchAll({ type: "window" });
      windows
        .filter((client) => new URL(client.url).pathname.startsWith("/posts/"))
        .forEach((client) => client.navigate(client.url));
    })(),
  );
});
