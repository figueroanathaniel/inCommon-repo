/* geocode-online.js: the one part of inCommon that needs a signal. V1.0.0

   WHAT LEAVES THE DEVICE, AND WHEN. One HTTPS request carrying one string: the
   place someone typed, sent only when they press the button, and only after the
   170,000 place offline set has already failed to find it. Nothing else goes
   with it. No name, no birth date, no birth time, no profile, no identifier of
   any kind. The rest of the app never calls this file.

   WHY IT EXISTS. The offline set stops at settlements of about a thousand
   people. Below that, and for anything the gazetteer spells differently, the
   honest answer used to be "not found", which leaves a reader typing their own
   birthplace into a box that keeps refusing it. That is the failure this file
   removes.

   THE HARD PART IS NOT THE COORDINATES, IT IS THE ZONE. A geocoder returns a
   latitude and a longitude. A birth chart needs the IANA zone name, because the
   offset belongs to the date rather than to the place: birthUtcOffset asks the
   zone what it was doing in 1994, and no pair of coordinates can answer that.
   So the zone is taken from the nearest place in the offline set, restricted to
   the country the geocoder reported. The distance and the place it came from
   are both returned so the form can show its work rather than assert a zone.

   WHY IT REMEMBERS. A place found here is written to localStorage under both
   the typed spelling and the resolved label, so geocode() answers from the
   cache afterwards. That keeps birth_location a human readable string rather
   than a pair of numbers, which is the profile's stored shape, and it means the
   place is found offline from then on. A birthplace should need the network at
   most once, ever.

   Provider: Nominatim, the OpenStreetMap geocoder, https://nominatim.org/.
   Its usage policy allows at most one request per second and rules out
   per keystroke autocomplete. Both hold here by construction: this fires on an
   explicit press, and the gap below enforces the rate whatever the caller does.
   Heavy traffic would mean self hosting or a paid provider; the offline set
   makes that unlikely, since it answers nearly everything already. */
(function () {
  'use strict';

  var ENDPOINT = 'https://nominatim.openstreetmap.org/search';
  var MIN_GAP = 1100;      /* Nominatim: one request a second, with headroom. */
  var TIMEOUT = 9000;
  var CACHE_KEY = 'incommon.geocache';
  var MAX_CACHE = 200;
  /* Beyond this the nearest settlement is too far away to vouch for the zone,
     so the result says so instead of quietly claiming one. */
  var ZONE_KM = 120;

  var lastCall = 0;

  function gaz() { return window.Gazetteer; }
  function norm(s) {
    var G = gaz();
    return G && G.norm ? G.norm(s) : String(s || '').trim().toLowerCase();
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) {}
  }

  /* Nearest settlement in the offline set, preferring the country the geocoder
     named. Without that preference a birth just inside one border takes the
     zone of the country next door, which is the one error that would matter. */
  function zoneFor(lat, lon, cc) {
    var G = gaz();
    if (!G || !G.ROWS || !G.ROWS.length) return null;
    var rows = G.ROWS, want = cc ? String(cc).toUpperCase() : '';
    var k = Math.cos(lat * Math.PI / 180);

    function scan(filterCountry) {
      var best = null, bestD = Infinity;
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (filterCountry && (r.country || 'US').toUpperCase() !== want) continue;
        var dy = r.lat - lat, dx = (r.lon - lon) * k;
        var d = dy * dy + dx * dx;
        if (d < bestD) { bestD = d; best = r; }
      }
      return best ? { row: best, km: Math.sqrt(bestD) * 111.32 } : null;
    }

    /* Some countries in the geocoder have no settlement over a thousand people
       in the offline set at all. Falling back to the unrestricted scan is
       better than nothing, but it is flagged rather than presented as known. */
    var hit = want ? scan(true) : null;
    var sameCountry = !!hit;
    if (!hit) hit = scan(false);
    if (!hit) return null;

    return {
      timezone: hit.row.timezone,
      tzOffset: hit.row.tzOffset,
      from: hit.row.label,
      km: hit.km,
      sure: sameCountry && hit.km <= ZONE_KM
    };
  }

  /* Nominatim's display_name runs to eight or nine parts. Build a short label
     the way the offline set writes them: place, region, country. */
  function labelOf(r) {
    var a = r.address || {};
    var place = a.city || a.town || a.village || a.hamlet || a.municipality ||
                a.suburb || a.county || r.name || '';
    var region = a.state || a.region || a.province || a.county || '';
    var country = a.country || '';
    var parts = [];
    if (place) parts.push(place);
    if (region && region !== place) parts.push(region);
    if (country) parts.push(country);
    if (parts.length) return parts.join(', ');
    return String(r.display_name || '').split(',').slice(0, 3).join(',').trim();
  }

  function pause() {
    var wait = Math.max(0, MIN_GAP - (Date.now() - lastCall));
    return wait ? new Promise(function (r) { setTimeout(r, wait); }) : Promise.resolve();
  }

  var GO = {
    VERSION: '1.0.0',
    PROVIDER: 'OpenStreetMap Nominatim',

    /* Everything geocode() needs to answer without a network call. Keyed by the
       folded string, so the typed spelling and the chosen label both hit. */
    resolve: function (text) {
      var q = norm(text);
      if (!q) return null;
      var c = readCache()[q];
      return c && c.lat != null && c.lon != null ? c : null;
    },

    remember: function (typed, place) {
      if (!place || place.lat == null || place.lon == null) return;
      var c = readCache();
      var keys = Object.keys(c);
      /* Oldest out first. The cache is a convenience, not a record. */
      if (keys.length > MAX_CACHE) {
        keys.sort(function (a, b) { return (c[a].at || 0) - (c[b].at || 0); });
        keys.slice(0, keys.length - MAX_CACHE).forEach(function (k) { delete c[k]; });
      }
      var entry = {
        label: place.label, lat: place.lat, lon: place.lon,
        timezone: place.timezone, tzOffset: place.tzOffset,
        from: place.from || '', at: Date.now()
      };
      [norm(typed), norm(place.label)].forEach(function (k) { if (k) c[k] = entry; });
      writeCache(c);
      return entry;
    },

    forget: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} },
    cacheSize: function () { return Object.keys(readCache()).length; },

    /* Resolves to { hits: [...], note: '' }. Rejects with a message written for
       a reader rather than for a log, because the form prints it.

       WHY IT RETRIES SHORTER. Nominatim requires every term to match, against
       OSM's current administrative names. "Kirkby Lonsdale, Cumbria" returns
       nothing, because the county is filed as Westmorland and Furness now;
       "Kirkby Lonsdale" alone returns it at once. Someone naming the county
       they were born in is not wrong, and an empty result that blames them for
       it is the failure this whole file exists to remove. So a query that finds
       nothing is retried with its trailing qualifiers dropped.

       WHAT THAT COULD BREAK, AND DOES NOT. Dropping qualifiers is how "Paris,
       Texas" could come back as Paris, France. So the dropped words are kept
       and used to filter what returns: a result survives only if it still
       mentions them. If none do, the results are shown with a note naming the
       word that went unmatched, and nothing is ever committed without a press
       either way. */
    search: function (query) {
      var q = String(query || '').trim();
      if (q.length < 2) return Promise.resolve({ hits: [], note: '' });
      if (typeof fetch !== 'function') {
        return Promise.reject(new Error('This browser cannot make the lookup.'));
      }

      var parts = q.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var attempts = [q];
      for (var n = parts.length - 1; n >= 1 && attempts.length < 3; n--) {
        var shorter = parts.slice(0, n).join(', ');
        if (shorter !== q) attempts.push(shorter);
      }

      var self = this;
      function attempt(i) {
        if (i >= attempts.length) return Promise.resolve({ hits: [], note: '' });
        return self._once(attempts[i]).then(function (hits) {
          if (!hits.length) return attempt(i + 1);
          if (i === 0) return { hits: hits, note: '' };

          var dropped = parts.slice(attempts[i].split(',').length);
          var words = norm(dropped.join(' ')).split(' ').filter(Boolean);
          var kept = hits.filter(function (h) {
            var hay = norm(h.label + ' ' + h.haystack);
            return words.every(function (w) { return hay.indexOf(w) !== -1; });
          });
          if (kept.length) return { hits: kept, note: '' };
          return { hits: hits, note: 'Nothing there is filed under ' + dropped.join(', ') +
            '. These are what came back for ' + attempts[i] + ', so check the region before choosing.' };
        });
      }
      return attempt(0);
    },

    /* One request, one query string. */
    _once: function (q) {
      return pause().then(function () {
        lastCall = Date.now();
        var url = ENDPOINT + '?format=jsonv2&addressdetails=1&limit=6' +
                  '&accept-language=en&q=' + encodeURIComponent(q);
        var ctl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT);

        return fetch(url, {
          method: 'GET',
          signal: ctl ? ctl.signal : undefined,
          headers: { 'Accept': 'application/json' },
          referrerPolicy: 'no-referrer'
        }).then(function (res) {
          clearTimeout(timer);
          if (res.status === 429) throw new Error('The place directory is asking for a moment. Try again shortly.');
          if (!res.ok) throw new Error('The place directory answered ' + res.status + '.');
          return res.json();
        }).then(function (list) {
          if (!Array.isArray(list)) return [];
          return list.map(function (r) {
            var lat = parseFloat(r.lat), lon = parseFloat(r.lon);
            if (!isFinite(lat) || !isFinite(lon)) return null;
            var cc = (r.address && r.address.country_code) || '';
            var z = zoneFor(lat, lon, cc);
            return {
              label: labelOf(r),
              lat: Math.round(lat * 10000) / 10000,
              lon: Math.round(lon * 10000) / 10000,
              country: cc.toUpperCase(),
              /* No zone found at all: store it the way the manual coordinate
                 fields already do, and say the zone is unknown. */
              timezone: z ? z.timezone : 'manual',
              tzOffset: z ? z.tzOffset : Math.round(lon / 15),
              zoneSure: !!(z && z.sure),
              from: z ? z.from : '',
              km: z ? Math.round(z.km) : null,
              /* Everything the provider said about where this is, kept so a
                 dropped qualifier can be checked against it. */
              haystack: String(r.display_name || '')
            };
          }).filter(Boolean).filter(function (r, i, all) {
            return all.findIndex(function (o) { return o.label === r.label; }) === i;
          });
        }).catch(function (e) {
          clearTimeout(timer);
          if (e && e.name === 'AbortError') {
            throw new Error('The place directory did not answer in time.');
          }
          if (e instanceof TypeError) {
            throw new Error('Could not reach the place directory.');
          }
          throw e;
        });
      });
    }
  };

  window.GeoOnline = GO;
})();
