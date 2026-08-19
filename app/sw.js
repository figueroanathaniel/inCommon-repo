/*! sw.js: inCommon service worker V1. Cache-first for the app shell and all
 * local modules; stale-while-revalidate for Google Fonts. Everything the app
 * needs to run, core calculations, safety gate, practice library, crisis
 * resources, Stella's offline library: is local, so a cached shell means a
 * complete offline app, not a degraded one. */
var CACHE = 'incommon-v2.4';
var PRECACHE = [
  './', './inCommon (offline).html', './inCommonApp v2.dc.html', './support.js', './ios-frame.jsx',
  './manifest.json', './icon-192.png', './icon-512.png', './splash.png',
  './incommon-core.js', './safety-router.js', './stella-prompt-builder.js',
  './stella-post-processor.js', './stella-api.js', './practice-library.js', './memory-store.js',
  './profile-manager.js', './placement-content.js', './numerology-content.js', './angel-numbers.js',
  './sabian-symbols.js', './sabian-symbols-data.js', './minor-bodies-ephemeris.js',
  './hd-atlas.js', './astropedia.js', './gazetteer-us.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // tolerant precache: one missing file must not sink the install
    return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    // cache-first, refresh in background
    e.respondWith(caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) caches.open(CACHE).then(function (c) { c.put(e.request, res.clone()); });
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // stale-while-revalidate for fonts
    e.respondWith(caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        caches.open(CACHE).then(function (c) { c.put(e.request, res.clone()); });
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
