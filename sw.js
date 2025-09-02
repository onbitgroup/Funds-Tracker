self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("funds-tracker-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/CSS/style.css",
        "/JS/script.js",
        "/JS/target.js",
        "/icons/icon-192.png",
        "/icons/icon-512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
