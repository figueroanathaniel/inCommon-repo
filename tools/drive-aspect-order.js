#!/usr/bin/env node
/*! tools/drive-aspect-order.js: the aspect squares move, and stay moved.
 *
 * WHAT THIS IS. The owner asked on 7 November 2026 for the reader to be able
 * to rearrange the four aspect squares over the Placements table. This drives
 * the real controls in both shells (1440 desktop, 375 phone with touch):
 *
 *   a mouse drag moves a square and does not choose it (desktop);
 *   a quick sideways finger on the row moves nothing, chooses nothing and
 *   stays on the astrology page; a hold then drag moves the square (phone);
 *   Alt with an arrow key moves the focused square and keeps focus on it,
 *   and a plain arrow still chooses;
 *   the arrange button, a tap to lift and a tap to place, moves a square;
 *   the order survives a reload, and the first square is the one shown.
 *
 * HOW IT RUNS. Serves the repository on a free port and loads the source app
 * with WebGL off, as a guest on the default profile, Supabase blocked. Needs
 * Playwright and a Chromium.
 *
 * Usage: node tools/drive-aspect-order.js     exit 0 when every row passes
 */
'use strict';
const fs = require('fs'), http = require('http'), path = require('path');
const REPO = path.resolve(__dirname, '..');
function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  console.error('drive-aspect-order: Playwright is not installed. Install it (npm i -g playwright and\n' +
    'npx playwright install chromium) to run this tool.');
  process.exit(2);
}
const { chromium } = loadPlaywright();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const f = path.join(REPO, rel);
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const order=p=>p.evaluate(()=>[...document.querySelectorAll('[data-asp-tile]')].filter(e=>e.offsetParent).map(e=>e.getAttribute('data-asp-tile')).join(','));
const results=[]; const t=(n,ok,v)=>{results.push([n,ok,v]);console.log(ok?'PASS':'FAIL',n,v);};
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));
const APP='http://127.0.0.1:'+server.address().port+'/app/inCommonApp%20v2.dc.html';
const b=await chromium.launch({args:['--disable-webgl']});
try {
for (const [w,h,name,touch] of [[1440,900,'desk',false],[375,812,'phone',true]]) {
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch});
 await ctx.addInitScript(()=>{try{sessionStorage.setItem('incommon.guest.chosen','1');sessionStorage.setItem('incommon.guest.default','1');}catch(e){}});
 await ctx.route('**/supabase.co/**',r=>r.abort());
 const p=await ctx.newPage(); p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto(APP+'#/spirit/astrology',{timeout:120000});
 await p.waitForFunction(()=>window.__incommonApp&&window.__incommonApp.state.ready,null,{timeout:120000});
 await p.waitForTimeout(2000);
 const card=await p.evaluateHandle(()=>{const l=[...document.querySelectorAll('[data-ch-ledger]')].find(e=>e.offsetParent);l.scrollIntoView({block:'start'});l.scrollTop=0;return l.parentElement;});
 await p.waitForTimeout(500);
 t(name+' initial', (await order(p))==='conjunct,opposite,trine,square', await order(p));
 // drag trine (idx2) to first
 const box=async k=>p.evaluate(k=>{const e0=[...document.querySelectorAll('[data-asp-tile="'+k+'"]')].find(e=>e.offsetParent);const r0=e0.getBoundingClientRect();const hit=document.elementFromPoint(r0.x+r0.width/2,r0.y+r0.height/2);if(!e0.contains(hit))e0.scrollIntoView({block:'center',inline:'nearest'});const e=[...document.querySelectorAll('[data-asp-tile="'+k+'"]')].find(e=>e.offsetParent);const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width};},k);
 if(!touch){
   const a=await box('trine'), z=await box('conjunct');
   await p.mouse.move(a.x,a.y); await p.mouse.down();
   for(let i=1;i<=12;i++){await p.mouse.move(a.x+(z.x-a.x)*i/12,a.y); await p.waitForTimeout(30);}
   
   await p.mouse.up(); await p.waitForTimeout(300);
   t(name+' mouse drag', (await order(p))==='trine,conjunct,opposite,square', await order(p));
   t(name+' drag did not select', await p.evaluate(()=>window.__incommonApp.state.ledAsp||null)==='conjunct', await p.evaluate(()=>window.__incommonApp.state.ledAsp||null));
 } else {
   const a=await box('trine'), z=await box('conjunct');
   const cdp=await ctx.newCDPSession(p);
   const tp=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
   // quick swipe: should NOT reorder
   await tp('touchStart',a.x,a.y); for(let i=1;i<=6;i++){await tp('touchMove',a.x-i*15,a.y);await p.waitForTimeout(16);} await tp('touchEnd');
   await p.waitForTimeout(300);
   t(name+' quick swipe leaves order', (await order(p))==='conjunct,opposite,trine,square', await order(p));
   t(name+' swipe sel', await p.evaluate(()=>window.__incommonApp.state.ledAsp||null)===null, await p.evaluate(()=>window.__incommonApp.state.ledAsp||null));
   t(name+' still on astrology', await p.evaluate(()=>location.hash)==='#/spirit/astrology', await p.evaluate(()=>location.hash));
   await tp('touchStart',a.x,a.y); await p.waitForTimeout(450);
   for(let i=1;i<=12;i++){await tp('touchMove',a.x+(z.x-a.x)*i/12,a.y);await p.waitForTimeout(30);}
   
   await tp('touchEnd'); await p.waitForTimeout(300);
   t(name+' long-press drag', (await order(p))==='trine,conjunct,opposite,square', await order(p));
   t(name+' drag sel', await p.evaluate(()=>window.__incommonApp.state.ledAsp||null)==='conjunct', await p.evaluate(()=>window.__incommonApp.state.ledAsp||null));
   t(name+' hash after drag', await p.evaluate(()=>location.hash)==='#/spirit/astrology', await p.evaluate(()=>location.hash));
 }
 // keyboard: focus square (last) and Alt+Left
 await box('square');await p.evaluate(()=>{[...document.querySelectorAll('[data-asp-tile="square"]')].find(e=>e.offsetParent).focus();});
 await p.keyboard.press('Alt+ArrowLeft'); await p.waitForTimeout(300);
 t(name+' alt-left', (await order(p))==='trine,conjunct,square,opposite', await order(p));
 t(name+' focus kept', await p.evaluate(()=>document.activeElement.getAttribute('data-asp-tile'))==='square', await p.evaluate(()=>document.activeElement.getAttribute('data-asp-tile')));
 // plain arrow still selects
 await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
 t(name+' arrow selects', await p.evaluate(()=>window.__incommonApp.state.ledAsp)==='opposite', await p.evaluate(()=>window.__incommonApp.state.ledAsp));
 // arrange mode: tap opposite then trine
 const tapSel=async sel=>{const bx=await p.evaluate(s=>{const e0=[...document.querySelectorAll(s)].find(e=>e.offsetParent);const r0=e0.getBoundingClientRect();if(!e0.contains(document.elementFromPoint(r0.x+r0.width/2,r0.y+r0.height/2)))e0.scrollIntoView({block:'center'});const e=[...document.querySelectorAll(s)].find(e=>e.offsetParent);const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel); if(touch) await p.touchscreen.tap(bx[0],bx[1]); else await p.mouse.click(bx[0],bx[1]); await p.waitForTimeout(250);};
 await tapSel('[aria-label="Arrange the aspects"]');
 await tapSel('[data-asp-tile="opposite"]');
 
 await tapSel('[data-asp-tile="trine"]');
 t(name+' arrange place', (await order(p))==='opposite,trine,conjunct,square', await order(p));
 await tapSel('[aria-label="Done arranging"]');
 // persists after reload
 await p.reload(); await p.waitForFunction(()=>window.__incommonApp&&window.__incommonApp.state.ready,null,{timeout:120000}); await p.waitForTimeout(1500);
 t(name+' persists', (await order(p))==='opposite,trine,conjunct,square', await order(p));
 {const v=await p.evaluate(()=>[...document.querySelectorAll('[data-asp-tile][aria-checked="true"]')].filter(e=>e.offsetParent).map(e=>e.getAttribute('data-asp-tile')).join());t(name+' default pick is first', v==='opposite', v);}
 await ctx.close();}
} finally { await b.close(); server.close(); }
const bad=results.filter(r=>!r[1]);
console.log((bad.length?'drive-aspect-order: '+bad.length+' of ':'drive-aspect-order: ok, ')+results.length+' rows'+(bad.length?' failed':''));
process.exit(bad.length?1:0);})();
