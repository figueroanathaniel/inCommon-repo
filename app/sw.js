/*! sw.js: inCommon service worker V1. Cache-first for the app shell and all
 * local modules; stale-while-revalidate for Google Fonts. Everything the app
 * needs to run, core calculations, safety gate, practice library, crisis
 * resources, Stella's offline library: is local, so a cached shell means a
 * complete offline app, not a degraded one. */
/* THE NAME IS DELIBERATELY NOT THE SHIPPED ONE, AND THE NUMBER DELIBERATELY IS.
 *
 * There are two service workers in this repo and they are different programs.
 * This one is the SOURCE shell: it precaches every module separately, because
 * app/ is flat and the app loads them as separate script tags. The one beside
 * the bundle, deploy/<version>/sw.js, precaches one inlined index.html and
 * nothing else. They must never share a cache name, because activate() deletes
 * every key that is not its own: two workers agreeing on a name means whichever
 * activated last serves the other's files under its own fetch rules.
 *
 * So the prefix differs and the number does not. `dev` says which shell this
 * is, `v6.2` says which release it belongs to, and tools/build-bundle.js
 * refuses to build when the two numbers disagree. This drifted to v2.4 against
 * a shipped v6.0 precisely because nothing was checking.
 */
var CACHE = 'incommon-dev-v6.2';
var PRECACHE = [
  /* `./inCommon (offline).html` was here and the file has not existed for a
     long time. It was the standalone offline build, and the thing that does
     that job now is the deploy bundle: one inlined index.html with its own
     worker beside it. The precache is tolerant, so a missing entry cost
     nothing and told nobody, which is exactly why it sat here. docs/
     PROJECT_MEMORY.txt and the canonical build report still name it, and they
     keep it: they record what was true on a date rather than pointing at
     something. */
  './', './inCommonApp v2.dc.html', './support.js', './ios-frame.jsx',
  /* THE COVER, AND THE RENDERER IT WILL NOT DRAW WITHOUT.
     cover.html is the first screen a visitor meets. three.module.js and
     three.core.js are vendored beside the vendored React above, and for the
     same reason it is: a cached shell that has to reach a CDN to paint is not
     a cached shell. They are ES modules behind an import map, so they arrive
     as their own requests and both have to be here by name. */
  './cover.html', './three.module.js', './three.core.js',
  /* REACT, WITHOUT WHICH A CACHED SHELL IS A BLANK PAGE.
     The header above promises that everything the app needs is local, and it
     was: the app maps the two unpkg URLs to these files through
     window.__resources. What it was not was PRECACHED, and it never arrived in
     the cache at runtime either, so an offline launch served the whole document
     and all 35 modules out of cache and then mounted nothing, because the
     runtime had no React. The page came up empty with no error worth the name.
     The bundle never had this problem: React is inlined into its index.html. */
  './react-18.3.1.production.min.js', './react-dom-18.3.1.production.min.js',
  './manifest.json', '../inCommon%20Logo/icons/icon-192.png', '../inCommon%20Logo/icons/icon-512.png', '../inCommon%20Logo/icons/splash.png',
  './incommon-core.js', './safety-router.js', './oki-prompt-builder.js',
  './oki-post-processor.js', './oki-api.js', './practice-library.js', './memory-store.js',
  './profile-manager.js', './placement-content.js', './numerology-content.js', './angel-numbers.js', './animal-symbolism.js',
  './sabian-symbols.js', './sabian-symbols-data.js', './minor-bodies-ephemeris.js',
  './hd-topology.js', './hd-atlas.js', './astropedia.js', './iching.js', './gazetteer-us.js',
  './birth-time.js', './arc-solver.js', './ephemeris-cache.js', './hd-wheel.js', './hd-composite.js', './hd-circle.js',
  './people-library.js', './pair-cache.js', './analytics.js'
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

  /* THE SHELL IS FETCHED FRESH. EVERYTHING ELSE IS CACHE FIRST.

     This worker was cache first for navigations too, which is how a deploy
     fails to arrive: the bundle worker carries the same comment because it
     happened there first. A phone that had installed v3.6 kept being handed
     v3.6 out of its own cache while v3.8 sat on the server, correct and
     complete, and nothing about the device suggested it was two versions old.
     An app that updates itself by asking people to clear their cache does not
     update itself.

     The same fault has a second life in this repo: a harness frame loading the
     app from this worker can be graded against a build that is not on disk,
     which is why frame() busts the cache and why a browser test may need this
     worker unregistered first.

     So a navigation goes to the network and falls back to the cache when there
     is no signal, which keeps the offline promise whole and costs one small
     request when there is one. */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match('./inCommonApp v2.dc.html');
        });
      })
    );
    return;
  }

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
