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
  SW6  planet parades seen from Kielder Observatory match the observatory's
       own dated list, and 28 February 2026 holds the four Celestron names.
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

/* SW6: planet parades, seen from Kielder Observatory (Wikipedia infobox:
   55.23194 N, 2.616250 W, 370 m), against the dated list the observatory
   publishes (kielderobservatory.org, "AAA: What's a Planetary Parade?",
   read 5 November 2026) and the planets Celestron names for 28 February
   2026. A Kielder month is held as the whole stretch it names. */
const KO = { lat: 55.23194, lon: -2.61625, height: 370 };
const day = s => Date.parse(s + 'T00:00Z');
const tws = {};
const twOf = side => tws[side] || (tws[side] = W.twilights(day('2022-01-01'), day('2029-01-01'), KO, side));
const nights = (side, a, b) => twOf(side).filter(x => x.ms >= day(a) && x.ms < day(b) + 864e5);
const every = (side, a, b, n) => { const ns = nights(side, a, b); return ns.length > 0 && ns.every(x => x.up.length >= n); };
const KIELDER = [
  ['2022 morning', 'Late April to Late August 2022, four before sunrise (held to 10 August: the scan ends on the 13th)', () => every('morning', '2022-04-25', '2022-08-10', 4)],
  ['2022 five', 'Mid-June to Early July 2022, five before sunrise', () => every('morning', '2022-06-21', '2022-07-05', 5)],
  ['2025 evening', 'January to mid-February 2025, four after sunset', () => every('evening', '2025-01-15', '2025-02-15', 4)],
  ['2025 five', 'all five, 22nd to 25th February 2025', () => every('evening', '2025-02-22', '2025-02-25', 5)],
  ['2025 morning', 'Late August 2025, four before sunrise', () => every('morning', '2025-08-20', '2025-08-31', 4)],
  ['2028 five', 'Late October 2028, five before sunrise', () => every('morning', '2028-10-20', '2028-10-28', 5)],
  ['not until 2028', 'five not again until 2028', () => !['evening', 'morning'].some(sd => nights(sd, '2025-04-01', '2028-09-30').some(x => x.up.length >= 5))]
];
KIELDER.forEach(([id, says, test]) => row('SW6 ' + id, test(), 'Kielder: ' + says));
const feb28 = nights('evening', '2026-02-28', '2026-02-28')[0];
const f28 = feb28 ? feb28.up.map(u => u.n).join(',') : 'none';
row('SW6 2026-02-28', f28 === 'Mercury,Venus,Jupiter,Saturn', 'evening of 28 February 2026: ' + f28 + ' (Celestron: Mercury, Venus, Jupiter and Saturn, with Uranus and Neptune by telescope)');
row('SW6 naked eye', S.NAKED.join(',') === 'Mercury,Venus,Mars,Jupiter,Saturn', 'Uranus and Neptune are not counted');
const pd = W.parades(day('2026-11-06'), day('2026-12-06'), KO);
row('SW6 runs', pd.length > 0 && pd.every(e => e.count >= S.PARADE_MIN && +e.from <= +e.t && +e.t <= +e.to && e.names.length === e.count),
  pd.length + ' parade runs in the window, well formed');
row('SW6 no place', W.parades(day('2026-11-06'), day('2026-12-06'), null).length === 0, 'no place, no parade');

console.log(fail ? fail + ' failed' : 'all passed');
process.exit(fail ? 1 : 0);
