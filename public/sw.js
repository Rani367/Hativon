const POST_PAGE_CACHE = "hativon-post-pages-v1";
const POST_IMAGE_CACHE = "hativon-post-images-v1";
const POST_PAGE_TTL_MS = 30 * 60 * 1000;
const POST_IMAGE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_TIMESTAMP_HEADER = "x-hativon-cached-at";

function isPostPageNavigation(request, url) {
  return (
    request.method === "GET" &&
    request.mode === "navigate" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/posts/")
  );
}

function isOptimizedImageRequest(request, url) {
  return (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname === "/_next/image" &&
    url.searchParams.has("url")
  );
}

function getCachedAt(response) {
  const cachedAt = Number(response.headers.get(CACHE_TIMESTAMP_HEADER));
  return Number.isFinite(cachedAt) ? cachedAt : 0;
}

function isFresh(response, ttlMs) {
  const cachedAt = getCachedAt(response);
  return cachedAt > 0 && Date.now() - cachedAt < ttlMs;
}

async function stampResponse(response) {
  const headers = new Headers(response.headers);
  headers.set(CACHE_TIMESTAMP_HEADER, Date.now().toString());

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function putSuccessfulResponse(cache, request, response) {
  if (!response.ok || response.type !== "basic") {
    return;
  }

  await cache.put(request, await stampResponse(response.clone()));
}

async function cacheFirst(request, cacheName, ttlMs, event) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && isFresh(cachedResponse, ttlMs)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    event.waitUntil(putSuccessfulResponse(cache, request, networkResponse));
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (cacheName) =>
                  cacheName.startsWith("hativon-") &&
                  cacheName !== POST_PAGE_CACHE &&
                  cacheName !== POST_IMAGE_CACHE,
              )
              .map((cacheName) => caches.delete(cacheName)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (isPostPageNavigation(event.request, url)) {
    event.respondWith(
      cacheFirst(event.request, POST_PAGE_CACHE, POST_PAGE_TTL_MS, event),
    );
    return;
  }

  if (isOptimizedImageRequest(event.request, url)) {
    event.respondWith(
      cacheFirst(event.request, POST_IMAGE_CACHE, POST_IMAGE_TTL_MS, event),
    );
  }
});
