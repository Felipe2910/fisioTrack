const CACHE = "fisiotrack-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/models/eventModel.js",
  "./js/models/athleteModel.js",
  "./js/views/eventView.js",
  "./js/views/athleteView.js",
  "./js/controllers/eventController.js",
  "./js/controllers/athleteController.js",
  "./js/services/dbService.js",
  "./js/services/reportService.js",
  "./manifest.json",
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
