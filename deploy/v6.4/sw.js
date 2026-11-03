/*! sw.js: the inCommon offline shell.
 * The whole app lives inside app.html, so there is very little to keep: the
 * two pages, the install pieces, and the web fonts. Cache first, so a launch
 * with no signal is indistinguishable from a launch with one.
 *
 * THERE ARE TWO PAGES NOW. index.html is the cover and app.html is the app.
 * Both are precached, and so are the two three.js files the cover imports:
 * they are ES modules resolved through an import map, so they are fetched as
 * separate requests and a cover without them is the SIGNAL LOST message on a
 * machine that could have drawn the render.
 */
importScripts('./update-assets.js');
var CACHE = 'incommon-v6.4-oraplayer1';
var PRECACHE = [
  './', './index.html', './app.html', './manifest.json',
  './three.module.js', './three.core.js',
  './icon-192.png', './icon-512.png', './splash.png'
];

/* THE FALLBACK IS THE PAGE THAT WAS ASKED FOR, NOT ALWAYS THE COVER.

   With one page the offline answer to any navigation was that page. With two
   it is a choice, and answering /app.html with the cover is the wrong one: the
   reader asked for the app, and a cover with an arrow on it is one more click
   and nothing saying why. So only the bare address falls back to the cover,
   and everything else falls back to the app, which is the same split the
   _redirects beside this file make on the server. */
function shellFor(url) {
  return /\/(index\.html)?$/.test(url.pathname) ? './index.html' : './app.html';
}

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
      return Promise.all(keys.map(function (k) { return /^incommon-v/.test(k) && k !== CACHE ? caches.delete(k) : null; }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* This cache contains only a public, digest-verified compiled shell. It is
   isolated from ordinary cache lookup and never stores account data. */
var updates = self.UpdateAssets.create(self, self.registration.scope);
var staging = Promise.resolve();
self.addEventListener('message', function (event) {
  if (!event.data || !['IC_STAGE', 'IC_VERIFY'].includes(event.data.type) || !event.ports[0]) return;
  var source = event.source, port = event.ports[0];
  if (!source || !source.url || new URL(source.url).origin !== location.origin || !source.url.startsWith(self.registration.scope)) return;
  var data = event.data;
  var work = data.type === 'IC_STAGE'
    ? (staging = staging.catch(function () {}).then(function () { return updates.stage(data.currentBuild, data.recoverBoot === true); }))
    : updates.shell(data.build).then(function () { return { build: data.build }; });
  event.waitUntil(work.then(function (result) { port.postMessage({ ok: true, result: result }); },
    function () { port.postMessage({ ok: false }); }));
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

  if (req.mode === 'navigate' && url.searchParams.has('ic_update') &&
      url.pathname === new URL('app.html', self.registration.scope).pathname) {
    e.respondWith(updates.shell(url.searchParams.get('ic_update')).then(function (response) {
      /* Replace this shell only, after explicit reload navigation. Unrelated
         caches, source records and draft storage are never evicted. */
      return caches.open(CACHE).then(function (cache) {
        return cache.put(new URL('app.html', self.registration.scope).href, response.clone()).then(function () { return response; });
      });
    }).catch(function () {
      /* Never execute an unknown old cached program as a confirmed update.
         Back can recover the previous page; committed local data is retained. */
      return new Response('The update could not be verified. Use your browser Back button to return. Your local data has not been cleared.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'" } });
    }));
    return;
  }


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
        return caches.open(CACHE).then(function (c) { return c.match(req).then(function (hit) { return hit || c.match(shellFor(url)); }); });
      })
    );
    return;
  }

  // Same-origin: cache first, then network, then the app shell for navigations.
  e.respondWith(
    caches.open(CACHE).then(function (c) { return c.match(req); }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return req.mode === 'navigate' ? caches.open(CACHE).then(function (c) { return c.match(shellFor(url)); }) : Response.error();
      });
    })
  );
});
