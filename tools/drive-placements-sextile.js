/* Drives the aspect squares over the astrology Placements table: five of
   them now, the Sextile last, in both shells. Needs Playwright and Chromium.
   node tools/drive-placements-sextile.js [screenshot folder] */
const fs = require('fs'), http = require('http'), path = require('path');
const REPO = path.join(__dirname, '..');
let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node22/lib/node_modules/playwright'); } catch (e2) { console.log('drive-placements-sextile: NOT RUN, Playwright is not installed'); process.exit(0); } }
const OUT = process.argv[2] || null;
const server = http.createServer((req, res) => { const f = path.join(REPO, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } fs.createReadStream(f).pipe(res); });
let bad = 0; const t = (id, ok, info) => { if (!ok) bad++; console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + JSON.stringify(info)); };
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const APP = 'http://127.0.0.1:' + server.address().port + '/app/inCommonApp%20v2.dc.html';
  const b = await pw.chromium.launch({ args: ['--disable-webgl'] });
  for (const [w, h, name, touch] of [[1440, 900, 'desktop', false], [390, 844, 'phone', true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: OUT ? 2 : 1 });
    await ctx.addInitScript(() => { sessionStorage.setItem('incommon.guest.chosen', '1'); sessionStorage.setItem('incommon.guest.default', '1'); });
    await ctx.route('**/supabase.co/**', r => r.abort());
    const p = await ctx.newPage();
    await p.goto(APP + '#/spirit/astrology');
    await p.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, { timeout: 120000 });
    await p.waitForTimeout(2500);
    const grp = () => p.evaluate(() => { const g = [...document.querySelectorAll('[role=radiogroup][aria-label="Which aspect"]')].find(e => e.offsetParent); if (!g) return null;
      const rs = [...g.querySelectorAll('[role=radio]')]; return { n: rs.length, labels: rs.map(r => r.getAttribute('aria-label')), on: rs.filter(r => r.getAttribute('aria-checked') === 'true').map(r => r.getAttribute('aria-label')),
        minW: Math.min(...rs.map(r => r.getBoundingClientRect().width)), minH: Math.min(...rs.map(r => r.getBoundingClientRect().height)), sym: rs[rs.length - 1].textContent.trim(),
        fits: g.scrollWidth <= g.clientWidth + 1 }; });
    const a = await grp();
    t(name + ' S1', a && a.n === 5 && a.labels.join() === 'Conjunction,Opposition,Trine,Square,Sextile', a && a.labels);
    t(name + ' S2', a && a.minW >= 44 && a.minH >= 44 && a.fits, a && { minW: Math.round(a.minW), minH: Math.round(a.minH), fits: a.fits });
    t(name + ' S3', a && a.sym.charAt(0) === '\u26b9', a && a.sym);
    await p.evaluate(() => { const g = [...document.querySelectorAll('[role=radiogroup][aria-label="Which aspect"]')].find(e => e.offsetParent); g.scrollIntoView({ block: 'start' }); [...g.querySelectorAll('[role=radio]')].pop().click(); });
    await p.waitForTimeout(500);
    const s = await grp();
    const shown = await p.evaluate(() => { const g = [...document.querySelectorAll('[role=radiogroup][aria-label="Which aspect"]')].find(e => e.offsetParent); const box = g.parentElement;
      const line = box.querySelector('p').textContent.trim(); const pairs = [...box.querySelectorAll('ul button')].map(x => x.getAttribute('aria-label'));
      const none = [...box.querySelectorAll('p')].map(x => x.textContent).find(x => /No two placements/.test(x)) || ''; return { line, pairs, none }; });
    const mean = await p.evaluate(() => window.__incommonApp.ASP_MEAN.sextile);
    t(name + ' S4', s.on.join() === 'Sextile' && shown.line.toLowerCase().indexOf(mean.slice(1)) !== -1, { on: s.on, line: shown.line.slice(0, 60) });
    t(name + ' S5', shown.pairs.length ? shown.pairs.every(x => / sextile /.test(x)) : /a sextile/.test(shown.none), { pairs: shown.pairs.slice(0, 3), n: shown.pairs.length, none: shown.none });
    if (OUT) await p.screenshot({ path: path.join(OUT, name + '-sextile.png') });
    await ctx.close();
  }
  await b.close(); server.close();
  console.log(bad ? 'drive-placements-sextile: ' + bad + ' failed' : 'drive-placements-sextile: ok, 10 rows');
  process.exit(bad ? 1 : 0);
})();
