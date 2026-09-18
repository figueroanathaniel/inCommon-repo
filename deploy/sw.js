/*! sw.js: the inCommon offline shell.
 * The whole app lives inside index.html, so there is very little to keep: the
 * page itself, the install pieces, and the web fonts. Cache first, so a launch
 * with no signal is indistinguishable from a launch with one.
 */
var CACHE = 'incommon-v5.6';
var PRECACHE = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './splash.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // One miss should not fail the whole install.
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Google Fonts: serve what we have, refresh quietly in the background.
  if (url.hostname.indexOf('fonts.googleapis.com') > -1 || url.hostname.indexOf('fonts.gstatic.com') > -1) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  /* THE SHELL IS FETCHED FRESH, EVERYTHING ELSE IS CACHE FIRST.

     Cache first for a navigation is how a deploy fails to arrive. v3.8 sat on
     the server, correct and complete, while a phone that had already installed
     v3.6 kept being handed v3.6 out of its own cache: the logo was missing, the
     library was still broken, and nothing about the device suggested it was
     looking at a build two versions old. An app that updates itself by asking
     people to clear their cache does not update itself.

     So a navigation goes to the network first and falls back to the cache when
     there is no signal, which keeps the offline promise intact and costs one
     small request when there is one. Everything else, the icons and the fonts,
     stays cache first: those are the files that never change without their
     name changing. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Same-origin: cache first, then network, then the app shell for navigations.
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return req.mode === 'navigate' ? caches.match('./index.html') : Response.error();
      });
    })
  );
});
