const CACHE = "fisiotrack-v8";

const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/models/eventModel.js",
  "./js/models/physioModel.js",
  "./js/views/eventView.js",
  "./js/views/physioView.js",
  "./js/controllers/eventController.js",
  "./js/controllers/physioController.js",
  "./js/services/dbService.js",
  "./js/services/reportService.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./font/Play-Regular.woff2",
  "./font/Play-Regular.woff",
  "./font/Play-Bold.woff2",
  "./font/Play-Bold.woff",
  "./font/Emotion-Engine.woff2",
  "./font/Emotion-Engine.woff",
  "./font/Emotion-Engine-Bold.woff2",
  "./font/Emotion-Engine-Bold.woff",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
