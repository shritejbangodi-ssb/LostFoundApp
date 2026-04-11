const CACHE_NAME = "lostfound-cache-v6";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./auth.js",
  "./firebase-init.js",
  "./inbox.html",
  "./found.html",
  "./lost.html",
  "./upload.html",
  "./chat.html",
  "./matches.html",
  "./login.html",
  "./signup.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME).map(cache => caches.delete(cache))
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Use cache instantly
        }
        return fetch(event.request).then(networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                return networkResponse;
            }
            // Clone the response and save it dynamically!
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
            });
            return networkResponse;
        }).catch(() => {
            console.log("Offline mode activated.");
        });
      })
  );
});
