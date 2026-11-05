#!/usr/bin/env node
/*! tools/drive-progressions.js: the progressed Sun and Moon, held to the Swiss Ephemeris.
 *
 * WHAT THIS IS. progressedHandoff() in the app finds when the progressed Sun
 * and Moon (one day after birth for each year of life) change sign. This
 * drives the app over the 500 births in tools/fixtures/progressions-swiss.json
 * at that file's fixed now, and holds each answer to the Swiss Ephemeris's:
 *
 *   PR1  every last and next ingress lands within half a day of the reference,
 *        in the reader's calendar
 *   PR2  the progressed longitude now is within 10 arcseconds
 *   PR3  the month and year the page prints is the reference's month (a date
 *        within three days of a month's edge may print either)
 *
 * The reference was computed by a small C program against the Swiss Ephemeris
 * 2.10.03 (Moshier, no data files) from the pyswisseph source, with the app's
 * own birth instant passed in, so this tests the progression and its
 * ephemeris, not the birth time arithmetic (group B holds that). Measured on
 * 5 November 2026 over 3,000 births: worst 0.24 day for the Sun and 0.03 for
 * the Moon, 2.4 and 4.0 arcseconds.
 *
 * Needs Playwright and a Chromium this repo does not install, and says so.
 * Usage: node tools/drive-progressions.js     exit 0 when every row passes
 */
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('drive-progressions: Playwright is not installed here, NOT RUN'); process.exit(2); }
const http = require('http'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..');
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/progressions-swiss.json'), 'utf8'));
const TYPES = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(REPO, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(REPO)) { r.writeHead(403); r.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b); }); }).listen(0);
(async () => {
  let b; try { b = await chromium.launch(); } catch (e) { console.log('drive-progressions: no Chromium, NOT RUN'); srv.close(); process.exit(2); }
  const pg = await b.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.clock.setFixedTime(new Date(FX.now));
  await pg.addInitScript(() => { sessionStorage.setItem('incommon.guest.chosen', '1'); localStorage.setItem('incommon.firstrun', '1'); });
  await pg.route(/supabase\.co|googleapis|gstatic/, r => r.abort());
  await pg.goto(`http://127.0.0.1:${srv.address().port}/app/inCommonApp%20v2.dc.html#/today`);
  await pg.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
  const got = await pg.evaluate(births => { const A = window.__incommonApp, PM = window.ProfileManager;
    return births.map(x => { PM.updateProfile(PM.activeId(), { birthDate: x.date, birthTime: x.time, birthLocation: x.place }); A._progMemo = {};
      const nd = A.natalDate(), S = A.progressedHandoff('Sun'), M = A.progressedHandoff('Moon');
      return { jd: nd.getTime() / 86400000 + 2440587.5, sun: S && [S.last, S.next, S.lonNow, S.paras[0]], moon: M && [M.last, M.next, M.lonNow, M.paras[0]] }; }); }, FX.births);
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fails = { PR1: [], PR2: [], PR3: [], PR0: [] }; let worstD = 0, worstL = 0;
  const dd = (a, r) => (a == null || a < 0) && r < 0 ? 0 : (a == null || a < 0 || r < 0) ? Infinity : Math.abs(a - r) * FX.yearDays;
  FX.births.forEach((x, i) => { const g = got[i];
    if (Math.abs(g.jd - x.jdUt) > 1e-6) { fails.PR0.push(x.date + ' ' + x.time + ' birth instant moved'); return; }
    [['sun', 'Sun'], ['moon', 'Moon']].forEach(([k, nm]) => { const a = g[k], R = x[k];
      if (!a) { fails.PR1.push(x.date + ' ' + nm + ' no answer'); return; }
      const d = Math.max(dd(a[0], R[0]), dd(a[1], R[1])); worstD = Math.max(worstD, d); if (!(d <= 0.5)) fails.PR1.push(x.date + ' ' + x.time + ' ' + nm + ' ' + d.toFixed(3) + ' days');
      let l = Math.abs(a[2] - R[2]); if (l > 180) l = 360 - l; l *= 3600; worstL = Math.max(worstL, l); if (!(l <= 10)) fails.PR2.push(x.date + ' ' + nm + ' ' + l.toFixed(2) + '"');
      if (R[0] >= 0) { const t = (x.jdUt - 2440587.5) * 86400000 + R[0] * FX.yearDays * 86400000, ok = [-3, 0, 3].some(o => { const dt = new Date(t + o * 86400000); return a[3].indexOf(MON[dt.getMonth()] + ' ' + dt.getFullYear()) !== -1; });
        if (!ok) fails.PR3.push(x.date + ' ' + nm + ': ' + a[3]); } }); });
  const row = (id, txt) => { const f = fails[id]; console.log((f.length ? 'FAIL ' : 'pass ') + id + ' ' + txt + (f.length ? ' (' + f.length + ') ' + f.slice(0, 3).join('; ') : '')); };
  row('PR0', 'the app draws each fixture birth for the instant the reference used');
  row('PR1', 'ingresses within half a day of the Swiss Ephemeris, worst ' + worstD.toFixed(3) + ' days');
  row('PR2', 'progressed longitude within 10", worst ' + worstL.toFixed(2) + '"');
  row('PR3', 'the printed month is the reference month');
  if (errs.length) console.log('page errors:', errs.slice(0, 3));
  await b.close(); srv.close();
  process.exit(Object.values(fails).some(f => f.length) || errs.length ? 1 : 0);
})();
