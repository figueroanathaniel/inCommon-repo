#!/usr/bin/env node
/* check-chart-traditions.js: holds app/chart-traditions.js to its references.
   CT1 Lahiri against the Swiss Ephemeris documentation's values, which match
   the Indian Astronomical Ephemeris (1950 to 2020), within 0.05 arcsecond.
   CT2 the lunar new year against tools/fixtures/chinese-new-year.json, every
   year from 1900 to 2100. CT3 the sexagenary day (1949-10-01 Jia-Zi,
   2000-01-01 Wu-Wu). CT4 the Four Pillars month by the Five Tigers rule.
   CT5 nakshatras and Vimshottari sum to 120 years. CT6 ten studies, unique keys.
   CT7 the navamsa: the modality rule equals the element rule and the
   continuous count at every 0.001 degree, DekhoPanchang's worked example
   (Aries 16 43 is part 6, Virgo), HinduTone's table (Taurus 0 is Capricorn),
   and vargottama where the two signs agree. */
'use strict';
const path = require('path');
const A = require(path.join(__dirname, '../app/astronomy-engine-2.1.19.min.js'));
const T = require(path.join(__dirname, '../app/chart-traditions.js'));
const fx = require(path.join(__dirname, 'fixtures/chinese-new-year.json'));
let fails = 0;
const row = (id, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + id + (info ? ' ' + info : '')); if (!ok) fails++; };
const dms = (d, m, s) => d + m / 60 + s / 3600;
const refs = [[2433282.5, dms(23, 9, 31.2539)], [2447527.5, dms(23, 42, 12.3717)], [2447892.5, dms(23, 43, 2.6259)],
  [2451545, dms(23, 51, 25.5324)], [2458485, dms(24, 7, 21.1353)], [2458850, dms(24, 8, 11.3962)]];
const worst = Math.max(...refs.map(([j, v]) => Math.abs(T.ayanamsa('lahiri', j) - v) * 3600));
row('CT1', worst < 0.05, 'worst ' + worst.toFixed(3) + ' arcsec over ' + refs.length);
let bad = [];
for (const s of fx.dates) { const y = +s.slice(0, 4), d = new Date((T.lunarNewYear(A, y) - 2440587.5) * 864e5).toISOString().slice(0, 10); if (d !== s) bad.push(y + ':' + d); }
row('CT2', bad.length === 0 && fx.dates.length === 201, bad.length + ' of ' + fx.dates.length + ' differ ' + bad.join(' '));
row('CT3', T.dayIndex(2433191) === 0 && T.dayIndex(2451545) === 54);
const jd = Date.UTC(1985, 0, 9, 12) / 864e5 + 2440587.5, fp = T.fourPillars(A, jd, 0, true);
row('CT4', fp.year.stem + fp.year.branch === 'JiaZi' && fp.month.stem + fp.month.branch === 'DingChou', fp.year.stem + fp.year.branch + ' ' + fp.month.stem + fp.month.branch);
const n = T.nakshatra(0.1), v = T.vimshottari(0.1, 2451545, 9), yrs = T.DASHA.reduce((a, d) => a + d[1], 0);
row('CT5', n.name === 'Ashwini' && n.pada === 1 && n.lord === 'Ketu' && yrs === 120 && v.length === 9 && T.nakshatra(359.9).name === 'Revati');
row('CT6', T.STUDIES.length === 10 && new Set(T.STUDIES.map(s => s.key)).size === 10);
{
  const EL = [0, 9, 6, 3], bad7 = [];
  for (let i = 0; i < 360000; i++) {
    const l = i / 1000 + 0.0004, nv = T.navamsa(l), s = Math.floor(l / 30), part = Math.floor((l - s * 30) * 9 / 30);
    const byEl = (EL[s % 4] + part) % 12, cont = Math.floor(l * 9 / 30) % 12;
    if (nv.sign !== byEl || nv.sign !== cont || nv.vargottama !== (nv.sign === s)) { bad7.push(l.toFixed(4)); if (bad7.length > 5) break; }
  }
  const ex = T.navamsa(16 + 43 / 60), tau = T.navamsa(30.5), ar = T.navamsa(1), le = T.navamsa(120 + 13.5), cnt = (() => { let k = 0; for (let s = 0; s < 12; s++) for (let p = 0; p < 9; p++) if (T.navamsa(s * 30 + p * 30 / 9 + 0.1).vargottama) k++; return k; })();
  row('CT7', bad7.length === 0 && ex.part === 6 && ex.rashi === T.RASHI[5] && tau.rashi === T.RASHI[9] && ar.vargottama && le.vargottama && cnt === 12,
    (bad7.length ? 'differ at ' + bad7.join(' ') + '; ' : '') + 'example ' + ex.part + ' ' + ex.rashi + ', taurus0 ' + tau.rashi + ', vargottama ' + cnt);
}
console.log(fails ? fails + ' failed' : 'all passed');
process.exit(fails ? 1 : 0);
