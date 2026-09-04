#!/usr/bin/env node
/* build-gazetteer.js: turn the GeoNames cities1000 dump into app/gazetteer-world.js
 *
 * WHY cities1000 AND NOT allCountries. The Ascendant moves about one degree per
 * four minutes of time. Measured on a real chart, moving the birth city 1 km
 * shifts the Ascendant 0.009 degrees, 20 km shifts it 0.186. Rounding a birth
 * time to the nearest five minutes, which is what hospital records routinely
 * do, shifts it 0.986. So location precision below a few kilometres is already
 * an order of magnitude inside the noise floor set by the clock. The 5.2M
 * allCountries set is overwhelmingly hamlets and farmsteads: it costs about
 * 200 MB and buys roughly 0.04 degrees. cities1000 keeps every settlement a
 * person is plausibly born in, at about 6 MB, and the app stays offline.
 *
 * WHAT IS DELIBERATELY NOT STORED. No UTC offset per city. An offset is a
 * function of the date, not of the place: storing one is what made every
 * summer birth read an hour late until natalDateFor started deriving it from
 * the zone's own history. The IANA zone name is the durable fact and
 * birthUtcOffset does the rest.
 *
 * OUTPUT SHAPE. Same house format as gazetteer-us.js: rows joined by |,
 * fields by comma, grouped by country so the country code is not repeated.
 * The module appends into the array gazetteer-us.js already exported as
 * Gazetteer.ROWS, so search(), lookup() and the ranking keep working
 * unchanged and the US landmark proxies survive.
 *
 * Usage: node tools/build-gazetteer.js <dir with cities1000.txt, countryInfo.txt, admin1CodesASCII.txt>
 */
'use strict';

const fs = require('fs');
const path = require('path');

const src = process.argv[2];
if (!src) { console.error('build-gazetteer: pass the directory holding the GeoNames files'); process.exit(1); }
const repo = path.resolve(__dirname, '..');
const OUT = path.join(repo, 'app', 'gazetteer-world.js');

const need = ['cities1000.txt', 'countryInfo.txt', 'admin1CodesASCII.txt'];
for (const f of need) {
  if (!fs.existsSync(path.join(src, f))) { console.error('build-gazetteer: missing ' + f + ' in ' + src); process.exit(1); }
}

/* ---- country code -> name ---- */
const countries = {};
for (const line of fs.readFileSync(path.join(src, 'countryInfo.txt'), 'utf8').split('\n')) {
  if (!line || line[0] === '#') continue;
  const f = line.split('\t');
  if (f[0] && f[4]) countries[f[0]] = f[4];
}

/* ---- "US.NJ" -> "New Jersey" ---- */
const admin1 = {};
for (const line of fs.readFileSync(path.join(src, 'admin1CodesASCII.txt'), 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  if (f[0] && f[1]) admin1[f[0]] = f[1];
}

/* ---- the places ---- */
const tzList = [];
const tzIndex = new Map();
const byCountry = new Map();
let kept = 0, skipped = 0, sanitised = 0, aliasRows = 0, aliasCount = 0;

const KEEP = /^(PPL|PPLA|PPLA2|PPLA3|PPLA4|PPLA5|PPLC|PPLG|PPLL|PPLR|PPLS|PPLX|STLMT)$/;

/* Must fold identically to gazetteer-us.js: that module normalises the query,
   this one normalises the keys it is matched against. */
const FOLD = { 'ß': 'ss', 'ø': 'o', 'æ': 'ae', 'œ': 'oe',
  'ð': 'd', 'þ': 'th', 'ł': 'l', 'đ': 'd', 'ı': 'i' };
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ßøæœðþłđı]/g, c => FOLD[c] || c)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/* WHICH ALTERNATE NAMES ARE WORTH THEIR BYTES.
   All 408,000 latin-script alternate names cost 4.4 MB raw, 1.7 MB gzipped,
   which nearly doubles what a phone downloads. Above this population they cost
   1.45 MB raw, 0.57 MB gzipped, for 21,599 cities.

   The cut is on population rather than on which spellings look important,
   because exonyms are a property of prominence: Munich has forty-seven of them
   and a village of twelve hundred has none. Its own name is the only name it
   has, and the row now stores that name exactly, so nothing is lost at the
   bottom of the range. Choosing between spellings, rather than between cities,
   would have meant deciding whose name for their own birthplace was worth
   keeping, which is not a decision this file should be making. */
const ALIAS_POP = 20000;
const LATIN = /^[\x20-\x7eÀ-ɏ]+$/;

const lines = fs.readFileSync(path.join(src, 'cities1000.txt'), 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  const f = line.split('\t');
  if (f.length < 18) { skipped++; continue; }
  const fcode = f[7];
  if (!KEEP.test(fcode)) { skipped++; continue; }

  /* The place's own name, not GeoNames' ascii transliteration of it.
     This was the other way round, and asciiname is not what anybody types:
     Zürich is stored there as "Zuerich", Malmö as "Malmoe", Gdańsk as
     "Gdansk". Since norm() folds diacritics, the accented name matches an
     unaccented query anyway, so the transliteration bought nothing and cost
     2,424 cities their own spelling. It is kept below as an alternate. */
  let name = f[1] || f[2];
  if (!name) { skipped++; continue; }
  if (/[,|]/.test(name)) { name = name.replace(/[,|]/g, ' ').replace(/\s+/g, ' ').trim(); sanitised++; }

  const lat = Number(f[4]), lon = Number(f[5]);
  if (!isFinite(lat) || !isFinite(lon)) { skipped++; continue; }
  const cc = f[8] || '';
  const a1 = f[10] || '';
  /* Population is only ever used to rank search hits, and the ranking takes
     log10 of it, so the last two digits cannot change an ordering. Stored in
     hundreds to save roughly two characters on every one of 170,000 rows. */
  const pop = Math.round((Number(f[14]) || 0) / 100);
  const tz = f[17] || '';
  if (!tz) { skipped++; continue; }

  let ti = tzIndex.get(tz);
  if (ti === undefined) { ti = tzList.length; tzList.push(tz); tzIndex.set(tz, ti); }

  /* Alternate spellings, folded and deduped against the name we just stored.
     Semicolon separated so the row stays comma delimited. Non latin scripts are
     dropped: the app's own text is latin, and a query typed in Cyrillic or Han
     would not reach here through the form's keyboard in the first place. */
  const seen = new Set([norm(name)]);
  const alts = [];
  const consider = a => {
    if (!a || a.length > 40 || !LATIN.test(a)) return;
    const n = norm(a);
    if (!n || seen.has(n)) return;
    seen.add(n); alts.push(n);
  };
  consider(f[2]);                                   // the ascii transliteration
  if (Number(f[14]) >= ALIAS_POP) (f[3] || '').split(',').forEach(consider);
  if (alts.length) { aliasRows++; aliasCount += alts.length; }

  const row = [name, lat.toFixed(2), lon.toFixed(2), pop, ti, a1,
    fcode === 'PPLC' ? 1 : '', alts.join(';')].join(',');
  if (!byCountry.has(cc)) byCountry.set(cc, []);
  byCountry.get(cc).push(row);
  kept++;
}

/* Only ship the admin1 names actually referenced, and only for countries we
   kept, or the table is 150 KB of regions nothing points at. */
const usedA1 = new Set();
for (const [cc, rows] of byCountry) {
  for (const r of rows) {
    const a1 = r.split(',')[5];
    if (a1) usedA1.add(cc + '.' + a1);
  }
}
const a1Pairs = [...usedA1].filter(k => admin1[k]).map(k => k + '=' + admin1[k].replace(/[|=]/g, ' '));
const ccPairs = [...byCountry.keys()].filter(c => countries[c]).map(c => c + '=' + countries[c].replace(/[|=]/g, ' '));

const data = [...byCountry.entries()]
  .sort((a, b) => a[0] < b[0] ? -1 : 1)
  .map(([cc, rows]) => JSON.stringify(cc) + ':' + JSON.stringify(rows.join('|')))
  .join(',\n');

const out = `/* gazetteer-world.js: worldwide birth-city lookup. GENERATED, do not edit.
   Rebuild with: node tools/build-gazetteer.js <geonames dir>

   Source: GeoNames cities1000 (every populated place of 1000 or more),
   licensed CC BY 4.0, https://www.geonames.org/

   ${kept.toLocaleString()} places, ${ccPairs.length} countries, ${tzList.length} time zones,
   ${aliasCount.toLocaleString()} alternate spellings across ${aliasRows.toLocaleString()} of them.

   Each place is stored under its own name, the one written where it is: Zürich,
   not GeoNames' ascii "Zuerich". Queries are folded, so the unaccented spelling
   still finds it. Alternate spellings carry the other direction, the names a
   place is known by elsewhere, and are kept for places above ${ALIAS_POP.toLocaleString()} people,
   which is where exonyms exist at all. They match whole or from the front only.

   Coordinates are rounded to two decimals, about 1.1 km. On a real chart that
   is 0.009 degrees of Ascendant, against 0.99 degrees for a birth time rounded
   to five minutes, so the rounding is far inside the noise the clock already
   carries.

   No UTC offset is stored. An offset belongs to a date, not to a place: the
   zone name is the durable fact and birthUtcOffset derives the rest, including
   historic daylight-saving transitions.

   Population is stored in hundreds. It is used only to rank search hits, and
   the ranking takes log10, so the discarded digits cannot reorder anything.

   This appends into the array gazetteer-us.js exports as Gazetteer.ROWS, so
   search, lookup, the ranking and the US landmark proxies all keep working.
   It must load AFTER gazetteer-us.js. */
(function () {
  'use strict';
  var G = window.Gazetteer;
  if (!G || !Array.isArray(G.ROWS)) {
    console.warn('[gazetteer-world] Gazetteer not present. Load gazetteer-us.js first.');
    return;
  }

  var TZ = ${JSON.stringify(tzList.join('|'))}.split('|');
  var CC = {}, A1 = {};
  ${JSON.stringify(ccPairs.join('|'))}.split('|').forEach(function (p) { var i = p.indexOf('='); CC[p.slice(0, i)] = p.slice(i + 1); });
  ${JSON.stringify(a1Pairs.join('|'))}.split('|').forEach(function (p) { var i = p.indexOf('='); A1[p.slice(0, i)] = p.slice(i + 1); });

  var D = {
${data}
  };

  /* A standard-time offset per zone, used only as a fallback when a profile
     has no usable zone name. Taken as the lower of January and July so the
     southern hemisphere is not read as permanently in daylight saving. */
  var offCache = {};
  function stdOffset(tz) {
    if (offCache[tz] !== undefined) return offCache[tz];
    var v = 0;
    try {
      var at = function (d) {
        var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit' });
        var q = {};
        f.formatToParts(d).forEach(function (x) { q[x.type] = x.value; });
        return (Date.UTC(+q.year, +q.month - 1, +q.day, (+q.hour) % 24, +q.minute, +q.second) - d.getTime()) / 3600000;
      };
      v = Math.min(at(new Date(Date.UTC(2000, 0, 15))), at(new Date(Date.UTC(2000, 6, 15))));
    } catch (e) { v = 0; }
    offCache[tz] = v;
    return v;
  }

  /* The same fold gazetteer-us.js applies to the query, taken from the module
     that owns it rather than copied. Two copies of a normaliser drift, and a
     drifted normaliser here means a row that can never be found. */
  var norm = G.norm;
  if (typeof norm !== 'function') {
    console.warn('[gazetteer-world] Gazetteer.norm is missing. Load a matching gazetteer-us.js.');
    return;
  }

  /* The curated US set already covers ~430 places, at four decimals rather than
     two, and it carries the landmark proxies. Appending the world set on top
     would list Edison twice in the picker, once as "Edison, NJ" and once as
     "Edison, New Jersey, United States". Skip a world row when the curated set
     already holds that name in that US state, and keep the more precise one. */
  var have = {};
  G.ROWS.forEach(function (r) {
    if ((r.country || 'US') === 'US') have[norm(r.name) + '|' + (r.state || '')] = true;
  });

  var added = 0, deduped = 0;
  Object.keys(D).forEach(function (cc) {
    var cname = CC[cc] || cc;
    D[cc].split('|').forEach(function (r) {
      var f = r.split(',');
      if (f.length < 8) return;
      if (cc === 'US' && have[norm(f[0]) + '|' + (f[5] || '')]) { deduped++; return; }
      var name = f[0], lat = +f[1], lon = +f[2], pop = (+f[3] || 0) * 100;
      var tz = TZ[+f[4]] || 'UTC', a1 = f[5] || '', cap = f[6] === '1';
      var region = a1 ? (A1[cc + '.' + a1] || '') : '';
      var label = name + (region ? ', ' + region : '') + ', ' + cname;
      G.ROWS.push({
        name: name, state: a1, stateName: region || cname, country: cc,
        lat: lat, lon: lon, pop: pop,
        timezone: tz, tzOffset: stdOffset(tz), dst: true,
        capital: cap,
        label: label,
        /* Already folded by the build. Matched whole or from the front only,
           and deliberately kept out of key, which the loose tiers search. */
        alias: f[7] ? f[7].split(';') : [],
        /* The region code as well as its name. With only the name, "Paris, TX"
           found nothing: the row knew it was in Texas but not that Texas is
           written TX, which is how people write their own state. */
        key: norm(name + ' ' + a1 + ' ' + region + ' ' + cname + ' ' + cc)
      });
      added++;
    });
  });

  G.COUNT = G.ROWS.length;
  G.COVERAGE = 'worldwide \\u00b7 ' + added.toLocaleString() + ' places from GeoNames cities1000, plus the curated US set';
  G.WORLD = { places: added, deduped: deduped, countries: Object.keys(D).length, zones: TZ.length };
})();
`;

fs.writeFileSync(OUT, out, 'utf8');
const bytes = Buffer.byteLength(out, 'utf8');
console.log('build-gazetteer: wrote ' + OUT);
console.log('  places kept:   ' + kept.toLocaleString());
console.log('  skipped:       ' + skipped.toLocaleString());
console.log('  names cleaned: ' + sanitised + ' (comma or pipe removed)');
console.log('  alt spellings: ' + aliasCount.toLocaleString() + ' across ' + aliasRows.toLocaleString() + ' places');
console.log('  countries:     ' + ccPairs.length);
console.log('  time zones:    ' + tzList.length);
console.log('  admin regions: ' + a1Pairs.length);
console.log('  file size:     ' + (bytes / 1048576).toFixed(2) + ' MB');
