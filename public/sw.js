/* Salvazion — minimal service worker for installability (home screen icon). */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first; keep SW alive for "Add to Home Screen" / install criteria
self.addEventListener('fetch', () => {
  // passthrough — browser handles the request
});
