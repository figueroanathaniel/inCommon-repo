#!/usr/bin/env node
/* Real production-bundle presses and phone sheet clearance. This regression
   is independent of TF6's external check of the same name. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium, devices } = require('playwright');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../deploy/v6.4'));
const shotAt = process.argv.indexOf('--shots');
const shots = shotAt < 0 ? null : path.resolve(process.argv[shotAt + 1]);
let passed = 0, total = 0;
function check(name, ok, detail) {
  total++; if (ok) passed++; else process.exitCode = 1;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(detail));
}
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  try {
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch (_) { res.writeHead(404); res.end(); }
});
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const [width, height] of [[390,844],[375,667],[1440,900]]) {
      const phone = width < 820;
      const ctx = await browser.newContext({ ...(phone ? devices['iPhone 13'] : {}), viewport:{width,height}, screen:{width,height}, reducedMotion:'reduce' });
      await ctx.addInitScript(() => {
        sessionStorage.setItem('incommon.guest.chosen','1');
        sessionStorage.setItem('incommon.guest.default','1');
      });
      await ctx.route('**/supabase.co/**', route => route.abort());
      const page = await ctx.newPage();
      await page.goto('http://127.0.0.1:' + server.address().port + '/app.html#/spirit/human-design');
      await page.waitForFunction(() => window.__incommonApp && window.__incommonApp.state.ready, null, {timeout:120000});
      await page.evaluate(() => window.__incommonApp.setState({hdView:'3d'}));
      await page.waitForFunction(() => window.__incommonApp._hsS && window.__incommonApp._hsS.ready, null, {timeout:120000});
      await page.locator('[data-hs-scene]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2500);
      const point = () => page.evaluate(() => {
        const s = window.__incommonApp._hsS, r = s.el.pad.getBoundingClientRect();
        for (let y=8;y<r.height-8;y+=4) for(let x=8;x<r.width-8;x+=4) {
          const p=s.pickAt(x,y), hit=document.elementFromPoint(r.left+x,r.top+y);
          if(p && p.key==='c:Sacral' && hit && s.host.contains(hit)) return {x:r.left+x,y:r.top+y};
        }
        return null;
      });
      const press = async () => {
        let p; for (let n=0;n<12 && !p;n++) { p=await point(); if(!p) await page.waitForTimeout(500); }
        if (!p) throw Error(width + ': Sacral is not pickable');
        if (phone) await page.touchscreen.tap(p.x,p.y); else await page.mouse.click(p.x,p.y);
      };
      await press(); await page.waitForTimeout(400);
      check(width + ' first press only selects', await page.evaluate(() => !window.__incommonApp.state.hdPane), null);
      await press(); await page.waitForTimeout(2500);
      check(width + ' second press opens Sacral', await page.evaluate(() => window.__incommonApp.state.hdPane?.key === 'c:Sacral'), null);
      const bounds = await page.evaluate(() => {
        const r=document.querySelector('[data-hs-scene]').getBoundingClientRect(), p=document.querySelector('[data-hd-pane]').getBoundingClientRect();
        return {stage:{top:r.top,bottom:r.bottom,right:r.right,height:r.height},pane:{top:p.top,left:p.left},width:innerWidth,height:innerHeight};
      });
      check(width + ' stage clears reading', phone ? bounds.stage.bottom <= bounds.pane.top + 1 && bounds.stage.height > 0 : bounds.stage.right <= bounds.pane.left + 1, bounds);
      const selected = await page.evaluate(() => {
        const s=window.__incommonApp._hsS, c=s.cByName.Sacral;
        const v=c.mesh.position.clone(); v.z=.27;
        const p=s.screen(v), r=s.el.pad.getBoundingClientRect();
        const x=r.left+p.x, y=r.top+p.y, hit=document.elementFromPoint(x,y);
        return {x,y,visible:p.z<1 && p.x>=0 && p.x<=r.width && p.y>=0 && p.y<=r.height && !!hit && s.host.contains(hit)};
      });
      check(width + ' opened element remains visible on stage', selected.visible, selected);
      if (phone) {
        await page.evaluate(() => window.__incommonApp.hdPaneLow(true)); await page.waitForTimeout(300);
        await page.evaluate(() => window.__incommonApp.hdPaneLow(false)); await page.waitForTimeout(700);
        check(width + ' restored sheet still clears stage', await page.evaluate(() => document.querySelector('[data-hs-scene]').getBoundingClientRect().bottom <= document.querySelector('[data-hd-pane]').getBoundingClientRect().top + 1), null);
      }
      if (shots) { fs.mkdirSync(shots,{recursive:true}); await page.screenshot({path:path.join(shots,width+'x'+height+'-open.png')}); }
      await ctx.close();
    }
  } catch(e) { console.error(e); process.exitCode=1; }
  finally { if(browser) await browser.close(); server.close(); }
  console.log(passed + '/' + total + ' browser checks passed');
})();
