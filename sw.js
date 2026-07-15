// sw.js
// Bump this on every deploy. Changing it forces a fresh install/waiting cycle
// so the update banner has something to detect.
const myCacheVersion = "v2";
const myCacheName = `ollama-gemma4-12b-pwa-${myCacheVersion}`;

const myAssetsToCache = [
  "./",
  "./index.html",
  "./pwa/manifest.json",
  "./pwa/pwa.js",
  "./pwa/icon-192.png",
  "./pwa/icon-512.png"
];

// Install event: cache assets, but do NOT auto-activate.
// Leaving out skipWaiting() here means this new worker sits in "waiting"
// state until the page explicitly tells it to take over.
self.addEventListener("install", (myEvent) => {
  myEvent.waitUntil((async () => {
    const myCache = await caches.open(myCacheName);
    await myCache.addAll(myAssetsToCache);
  })());
});

// Activate event: clean up old versioned caches.
self.addEventListener("activate", (myEvent) => {
  myEvent.waitUntil((async () => {
    const myKeys = await caches.keys();
    await Promise.all(
      myKeys
        .filter((myKey) => myKey.startsWith("ollama-gemma4-12b-pwa-") && myKey !== myCacheName)
        .map((myKey) => caches.delete(myKey))
    );
    await self.clients.claim();
  })());
});

// Listen for the page telling us to activate immediately (user clicked "Update").
self.addEventListener("message", (myEvent) => {
  if (myEvent.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch event: network-first for navigations (HTML) so updates are picked up
// as soon as they're available, falling back to cache when offline.
// Everything else (icons, manifest, js) stays cache-first for speed.
self.addEventListener("fetch", (myEvent) => {
  const myIsNavigation = myEvent.request.mode === "navigate";

  if (myIsNavigation) {
    myEvent.respondWith((async () => {
      try {
        const myNetworkResponse = await fetch(myEvent.request);
        const myCache = await caches.open(myCacheName);
        myCache.put(myEvent.request, myNetworkResponse.clone());
        return myNetworkResponse;
      } catch (myError) {
        const myCachedResponse = await caches.match(myEvent.request);
        return myCachedResponse || caches.match("./index.html");
      }
    })());
    return;
  }

  myEvent.respondWith((async () => {
    const myCachedResponse = await caches.match(myEvent.request);
    if (myCachedResponse) {
      return myCachedResponse;
    }
    return fetch(myEvent.request);
  })());
});
