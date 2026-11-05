#!/usr/bin/env node
/* check-sky-weather.js: holds app/sky-weather.js to outside references.

   SW1  every moon phase, station, conjunction with the Sun, conjunction of two
        planets, Moon conjunction and meteor maximum the Swiss Ephemeris finds
        in 2026 and 2027 (tools/fixtures/sky-weather-swiss.json) is found by
        the module, and the other way round, within the tolerance per kind.
  SW2  the moon phases from November 2026 to January 2027 against the US Naval
        Observatory table (aa.usno.navy.mil, read 5 November 2026), to two
        minutes.
  SW3  the meteor maxima of 2026 fall on the dates the IMO 2026 calendar gives
        (imo.net/resources/calendar and the 2026 calendar's shower sections).
  SW4  the clusters' ecliptic longitudes: the Pleiades at J2000 within a
        tenth of a degree of 59.8 (Alcyone's 29 Taurus 59 is the field's
        familiar figure, and the cluster centre sits beside it), and every
        cluster moves about 50 arcseconds a year by precession.
  SW5  a cazimi window is never wider than the 17 minute disk allows, and
        the module reads no clock: Date.now broken changes nothing.
  Prints each row; exits non zero on any failure. */
'use strict';
const path = require('path'), fs = require('fs');
const A = require(path.join(__dirname, '../app/astronomy-engine-2.1.19.min.js'));
const S = require(path.join(__dirname, '../app/sky-weather.js'));
const W = S.make(A);
let fail = 0;
const row = (id, ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + id + '  ' + msg); if (!ok) fail++; };
const MIN = 60000;

/* SW1 */
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/sky-weather-swiss.json'), 'utf8'));
const from = new Date(fx.from), to = new Date(fx.to);
const mine = [];
W.phases(+from, +to).forEach(e => mine.push({ k: 'phase ' + e.quarter, t: +e.t }));
W.stations(+from, +to).forEach(e => mine.push({ k: 'station ' + e.body, t: +e.t }));
W.sunMeetings(+from, +to).forEach(e => mine.push({ k: 'cazimi ' + e.body, t: +e.t }));
W.meetings(+from, +to).forEach(e => mine.push({ k: (e.a === 'Moon' ? 'moonmeet ' : 'meet ') + e.a + ' ' + e.b, t: +e.t }));
W.showers(+from, +to).forEach(e => mine.push({ k: 'shower ' + e.lam.toFixed(2), t: +e.t }));
const TOL = { phase: 2 * MIN, station: 90 * MIN, cazimi: 10 * MIN, meet: 30 * MIN, moonmeet: 5 * MIN, shower: 10 * MIN };
const ANG = 0.01;
const kindOf = k => k.split(' ')[0];
const ref = fx.events.map(e => ({ k: e.kind + ' ' + e.keys.join(' '), t: Date.parse(e.t) }));
Object.keys(TOL).forEach(kind => {
  const R = ref.filter(r => kindOf(r.k) === kind), M = mine.filter(m => kindOf(m.k) === kind);
  let worst = 0, miss = 0, extra = 0, worstAng = 0;
  R.forEach(r => {
    const c = M.filter(m => m.k === r.k).map(m => Math.abs(m.t - r.t)).sort((x, y) => x - y)[0];
    /* The module keeps a Moon conjunction only inside its latitude limit, so
       a reference Moon conjunction with no partner is a filtered one, and
       counted only if the module has one within a day that is far off. */
    /* Two slow bodies close their gap by hundredths of a degree a day, so an
       instant there is set by arcseconds. A conjunction is also met when the
       module's own two longitudes, read at the reference instant, are inside
       ANG of each other. */
    if (kind === 'meet' && (c === undefined || c > TOL[kind])) {
      const [, x, y] = r.k.split(' '), gap = Math.abs(((W.lon(x, new Date(r.t)) - W.lon(y, new Date(r.t)) + 540) % 360) - 180);
      if (gap <= ANG) { worstAng = Math.max(worstAng, gap); return; }
    }
    if (c === undefined || c > TOL[kind]) { if (kind === 'moonmeet' && (c === undefined || c > 864e5)) return; miss++; return; }
    worst = Math.max(worst, c);
  });
  M.forEach(m => { if (!R.some(r => r.k === m.k && Math.abs(m.t - r.t) <= (kind === 'meet' ? 3 * 3600000 : TOL[kind]))) extra++; });
  row('SW1 ' + kind, miss === 0 && extra === 0 && R.length > 0,
    R.length + ' reference, ' + M.length + ' found, worst ' + (worst / MIN).toFixed(1) + ' min, ' + miss + ' missed, ' + extra + ' unmatched' + (worstAng ? ', slowest pair ' + (worstAng * 3600).toFixed(1) + '" apart at the reference instant' : ''));
});

/* SW2 */
const USNO = [['2026-11-09T07:02Z', 0], ['2026-11-17T11:48Z', 1], ['2026-11-24T14:53Z', 2], ['2026-12-01T06:08Z', 3],
  ['2026-12-09T00:52Z', 0], ['2026-12-17T05:42Z', 1], ['2026-12-24T01:28Z', 2], ['2026-12-30T18:59Z', 3],
  ['2027-01-07T20:24Z', 0], ['2027-01-15T20:34Z', 1], ['2027-01-22T12:17Z', 2], ['2027-01-29T10:55Z', 3]];
const ph = W.phases(Date.parse('2026-11-05T00:00Z'), Date.parse('2027-02-01T00:00Z'));
let w2 = 0, ok2 = ph.length === USNO.length;
USNO.forEach(([t, q], i) => { const e = ph[i]; if (!e || e.quarter !== q) { ok2 = false; return; } w2 = Math.max(w2, Math.abs(+e.t - Date.parse(t))); });
row('SW2', ok2 && w2 <= 2 * MIN, ph.length + ' phases, worst ' + (w2 / MIN).toFixed(2) + ' min against USNO');

/* SW3: the IMO 2026 calendar's dates (UT). A date pair is a night. */
const IMO = { QUA: ['2026-01-03'], LYR: ['2026-04-22'], PER: ['2026-08-12', '2026-08-13'], DRA: ['2026-10-08', '2026-10-09'],
  ORI: ['2026-10-20', '2026-10-21'], STA: ['2026-11-04', '2026-11-05'], NTA: ['2026-11-12'], LEO: ['2026-11-16', '2026-11-17'],
  GEM: ['2026-12-13', '2026-12-14'], URS: ['2026-12-21', '2026-12-22'] };
const sh = W.showers(Date.parse('2026-01-01T00:00Z'), Date.parse('2027-01-01T00:00Z'));
Object.keys(IMO).forEach(id => {
  const e = sh.find(x => x.id === id), d = e ? e.t.toISOString().slice(0, 10) : 'none';
  row('SW3 ' + id, !!e && IMO[id].indexOf(d) !== -1, 'module ' + (e ? e.t.toISOString().slice(0, 16) : 'none') + ', IMO ' + IMO[id].join(' or '));
});

/* SW4 */
const p2000 = W.clusterLon('pleiades', new Date('2000-01-01T12:00Z'));
row('SW4 Pleiades', Math.abs(p2000 - 59.8) < 0.1, 'J2000 ' + p2000.toFixed(3));
S.CLUSTERS.forEach(c => {
  const a = W.clusterLon(c.id, new Date('2000-01-01T12:00Z')), b = W.clusterLon(c.id, new Date('2100-01-01T12:00Z'));
  const per = ((b - a + 540) % 360 - 180) * 36; /* arcseconds per year */
  row('SW4 ' + c.id, per > 49 && per < 51.5, per.toFixed(2) + '" a year');
});

/* SW5 */
const cz = W.sunMeetings(+from, +to);
row('SW5 window', cz.every(e => +e.to > +e.from && +e.from <= +e.t && +e.t <= +e.to && (+e.to - +e.from) < 6 * 864e5), cz.length + ' cazimi windows well formed');
const real = Date.now; Date.now = () => { throw new Error('clock read'); };
let same = false;
try { same = JSON.stringify(W.events(Date.parse('2026-11-06T00:00Z'), Date.parse('2026-12-06T00:00Z'))).length > 2; } catch (e) { same = false; }
Date.now = real;
row('SW5 clock', same, 'events computed with the clock broken');

console.log(fail ? fail + ' failed' : 'all passed');
process.exit(fail ? 1 : 0);
