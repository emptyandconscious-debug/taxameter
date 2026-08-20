/* Taxameter service worker */
var CACHE = 'taxameter-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  /* stránka: najprv sieť (aby prišli aktualizácie), offline záloha z cache */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return r;
      }).catch(function () {
        return caches.match('./index.html');
      })
    );
    return;
  }

  /* vlastné súbory: cache-first */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (r) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          return r;
        });
      })
    );
  }
  /* Google mapy a fonty idú priamo na sieť */
});
