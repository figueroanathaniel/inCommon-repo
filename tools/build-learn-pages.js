#!/usr/bin/env node
/* build-learn-pages.js: the public reference pages, written into the bundle.

   WHY THESE EXIST. Everything the app knows lives behind hash routes inside
   one script driven page, so a search engine sees none of it: the cover is a
   canvas and app.html is noindex. These pages put the app's own reference
   writing at plain addresses a crawler can read, one page per entry, so a
   person searching "hexagram 34" or "angel number 444" can arrive at inCommon.
   Asked for by the owner on 16 October 2026.

   WHAT THEY ARE. Static HTML, no script, no web font, no third party request,
   built the way the legal pages are. They READ the same modules the app reads
   (iching.js, hd-atlas.js, timing-lexicon.js, angel-numbers.js,
   dream-symbols.js, animal-symbolism.js) and write nothing of their own beyond
   headings and one line on each hub, so a page cannot say one thing while the
   app says another. Change the writing in the module, rebuild, and both move.
   This is not a fork of the app: no screen, no chart, no state, only text.

   WHAT THEY LEAVE OUT, on purpose. The modules' caution and method fields are
   not drawn, by the owner's rule that no screen explains how a reading is made
   (CLAUDE.md, "No disclaimers"). An angel number the module only composes from
   its digits gets no page: a composed reading is thin and nine hundred of them
   would be the same page nine hundred times.

   THE SITE ADDRESS. SITE below is the canonical host. It is also written in
   the cover's head and in robots.txt, and this script refuses to build if
   either disagrees with it, so the three cannot drift.

   It writes deploy/<version>/learn/ (wiped and rewritten each run) and
   deploy/<version>/sitemap.xml. build-bundle.js calls it; it can also be run
   alone: node tools/build-learn-pages.js [outDir]  */
'use strict';

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const appDir = path.join(repo, 'app');
const SITE = 'https://incommonspace.com';
const APP = '/app.html';

function die(msg) { console.error('build-learn-pages: ' + msg); process.exit(1); }

/* ---------- the modules, loaded the way the app loads them ---------- */
function loadModules() {
  const g = global;
  const hadWindow = 'window' in g, hadSelf = 'self' in g;
  if (!hadWindow) g.window = g;
  if (!hadSelf) g.self = g;
  const req = f => require(path.join(appDir, f));
  const IChing = req('iching.js');
  const HD = req('hd-atlas.js');
  req('timing-lexicon.js'); req('angel-numbers.js'); req('dream-symbols.js'); req('animal-symbolism.js');
  const out = { IChing, HD, TL: g.window.TimingLexicon, AN: g.window.AngelNumbers,
    DS: g.window.DreamSymbols, AS: g.window.AnimalSymbolism };
  for (const k of Object.keys(out)) if (!out[k]) die('module ' + k + ' did not load');
  return out;
}

/* ---------- small helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DASHES = new RegExp('[' + String.fromCharCode(8212, 8211) + ']|&mdash;|&ndash;|&#821[12];|&#x201[34];', 'i');
const slug = s => String(s).toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function clip(s, n) {
  s = String(s).replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '\u2026';
}

/* The marks check-competitor-surface.js bars. The pages are build output, which
   that gate skips, so the same marks are asserted here over what is written. */
const MARKS = [/MyBodyGraph/i, /\bBodyGraph\b/, /the\s+human\s+design\s+system/i, /\bJovian\b/i,
  /\bBG5\b/, /\bOC16\b/, /\b(?:compatibility|match)\s+(?:score|rating|percentage|figure|rank(?:ing)?)\b/i];
const LABEL_RE = /<(title|h1|h2|h3)[^>]*>[^<]*bodygraph/i;

/* ---------- the page shell ---------- */
const CSS = `
  :root { --bg:#05060a; --sf:#11131f; --bd:#262a40; --tx:#eef0f8; --mut:#b7bccc; --hi:#b79bff;
    --link:#7d9bff; --ac:#2fff8f; --onac:#05060a;
    --fd:'Marcellus', Georgia, serif; --fb:Georgia, 'Times New Roman', serif;
    --fu:system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  * { box-sizing:border-box; }
  html { background:var(--bg); }
  body { margin:0; background:var(--bg); color:var(--tx); font:400 17px/1.7 var(--fb); }
  main { max-width:760px; margin:0 auto; padding:24px 16px 72px; }
  nav.crumbs { font:600 14px/1.5 var(--fu); margin-bottom:20px; display:flex; flex-wrap:wrap; gap:0 8px; align-items:center; }
  nav.crumbs a, nav.crumbs span { display:inline-flex; align-items:center; min-height:44px; }
  nav.crumbs span[aria-hidden] { color:var(--mut); }
  a { color:var(--link); text-underline-offset:3px; }
  a:focus-visible { outline:2px solid var(--hi); outline-offset:3px; border-radius:3px; }
  .kicker { font:700 13px/1.4 var(--fu); letter-spacing:.08em; text-transform:uppercase; color:var(--hi); margin:0 0 6px; }
  h1 { font:400 clamp(30px,6vw,44px)/1.15 var(--fd); margin:0 0 14px; }
  h2 { font:400 23px/1.3 var(--fd); margin:40px 0 10px; padding-top:10px; border-top:1px solid var(--bd); }
  h3 { font:700 15px/1.4 var(--fu); margin:22px 0 4px; color:var(--hi); }
  .lede { font-size:19px; }
  .ask { background:var(--sf); border:1px solid var(--bd); border-radius:14px; padding:16px 20px; margin:22px 0; font-style:italic; }
  .meta { font:400 15px/1.6 var(--fu); color:var(--mut); }
  ul.list { list-style:none; padding:0; margin:12px 0; }
  ul.list li { border-bottom:1px solid var(--bd); }
  ul.list a { display:block; padding:12px 2px; min-height:44px; text-decoration:none; }
  ul.list a strong { color:var(--tx); font:600 16px/1.4 var(--fu); }
  ul.list a span { display:block; color:var(--mut); font:400 14px/1.5 var(--fu); margin-top:2px; }
  ol.lines { padding-left:0; list-style:none; }
  ol.lines li { margin:0 0 14px; }
  ol.lines b { font:700 14px/1.4 var(--fu); color:var(--hi); display:block; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(64px,1fr)); gap:8px; padding:0; list-style:none; }
  .grid a { display:flex; align-items:center; justify-content:center; min-height:48px; background:var(--sf);
    border:1px solid var(--bd); border-radius:10px; text-decoration:none; font:600 15px var(--fu); }
  .cta { margin:44px 0 8px; padding:20px; background:var(--sf); border:1px solid var(--bd); border-radius:16px; }
  .cta p { margin:0 0 14px; }
  .btn { display:inline-flex; align-items:center; min-height:48px; padding:0 22px; border-radius:999px;
    background:var(--ac); color:var(--onac); font:700 16px var(--fu); text-decoration:none; }
  .btn:hover { filter:brightness(1.08); }
  .pn { display:flex; justify-content:space-between; gap:12px; margin-top:28px; font:600 15px var(--fu); }
  .pn a { display:inline-flex; align-items:center; min-height:44px; }
  footer { margin-top:48px; padding-top:18px; border-top:1px solid var(--bd); font:400 14px/1.8 var(--fu); color:var(--mut); }
  footer a { display:inline-flex; align-items:center; min-height:44px; margin-right:16px; }
  @media print { :root { --bg:#fff; --sf:#fff; --tx:#000; --mut:#333; --hi:#000; --link:#000; --bd:#999; } .cta { display:none; } }
`;

function page(o) {
  /* o: { path, title, desc, crumbs:[[label, path]], body, type, app, appLabel }
     app is the address of the same entry inside the app, after its #. The
     button opens it with ?from=learn, which lets the visitor straight in as a
     guest rather than at the sign in or the birth page (see learnGuest() in the
     app). */
  const url = SITE + o.path;
  const crumbs = [['inCommon', '/'], ['Learn', '/learn/']].concat(o.crumbs || []);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': o.type || 'Article', headline: o.h1 || o.title, description: o.desc, url: url,
      inLanguage: 'en', isPartOf: { '@type': 'WebSite', name: 'inCommon', url: SITE + '/' },
      publisher: { '@type': 'Organization', name: 'inCommon', url: SITE + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c[0], item: SITE + c[1] })).concat(
      o.path === crumbs[crumbs.length - 1][1] ? [] : [{ '@type': 'ListItem', position: crumbs.length + 1, name: o.h1 || o.title, item: url }]) }
  ] };
  const nav = crumbs.map((c, i) => (i ? '<span aria-hidden="true">/</span>' : '') +
    (c[1] === o.path ? '<span aria-current="page">' + esc(c[0]) + '</span>' : '<a href="' + c[1] + '">' + esc(c[0]) + '</a>')).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow">
<title>${esc(o.title)} · inCommon</title>
<meta name="description" content="${esc(o.desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="inCommon">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<!-- GENERATED by tools/build-learn-pages.js from the app's own modules. Do not edit by hand. -->
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<style>${CSS}</style>
</head>
<body>
<main>
<nav class="crumbs" aria-label="Breadcrumb">${nav}</nav>
${o.body}
<section class="cta" aria-label="inCommon">
<p>inCommon reads your astrology, Human Design and numerology together, with tarot, the Book of Changes, a dream journal and a private record of your own. Free to begin.</p>
<a class="btn" href="${APP}?from=learn#${o.app || '/library'}">${esc(o.appLabel || 'Open the Library in inCommon')}</a>
</section>
<footer>
<a href="/learn/">Learn</a><a href="/terms.html">Terms &amp; Conditions</a><a href="/privacy.html">Privacy Policy</a><a href="/accessibility.html">Accessibility</a>
</footer>
</main>
</body>
</html>
`;
}

const pn = (prev, next) => '<nav class="pn" aria-label="More">' +
  (prev ? '<a href="' + prev[1] + '" rel="prev">\u2190 ' + esc(prev[0]) + '</a>' : '<span></span>') +
  (next ? '<a href="' + next[1] + '" rel="next">' + esc(next[0]) + ' \u2192</a>' : '<span></span>') + '</nav>';
const p = s => '<p>' + esc(s) + '</p>';
const listItem = (href, title, sub) => '<li><a href="' + href + '"><strong>' + esc(title) + '</strong>' +
  (sub ? '<span>' + esc(sub) + '</span>' : '') + '</a></li>';

/* ---------- the collections ---------- */
function build(M) {
  const pages = [];
  const add = o => pages.push(o);
  const hexPath = n => '/learn/i-ching/hexagram-' + n + '/';
  const gatePath = n => '/learn/human-design/gates/gate-' + n + '/';

  /* I Ching: sixty four hexagrams */
  const hexes = [];
  for (let n = 1; n <= 64; n++) hexes.push(M.IChing.hexagram(n));
  hexes.forEach((h, i) => {
    const lines = h.lines.map((l, j) => '<li><b>Line ' + (j + 1) + '</b>' + esc(l) + '</li>').join('');
    const prev = i ? ['Hexagram ' + (i), hexPath(i)] : null;
    const next = i < 63 ? ['Hexagram ' + (i + 2), hexPath(i + 2)] : null;
    add({ path: hexPath(h.number), type: 'Article', app: '/library/i-ching/hexagram/' + h.number, appLabel: 'Open hexagram ' + h.number + ' in inCommon',
      title: 'I Ching Hexagram ' + h.number + ', ' + h.name,
      h1: 'Hexagram ' + h.number + ': ' + h.name,
      desc: clip('I Ching hexagram ' + h.number + ', ' + h.name + ' (' + h.pinyin + '). ' + h.judgment, 158),
      crumbs: [['The Book of Changes', '/learn/i-ching/']],
      body: '<p class="kicker">The Book of Changes \u00b7 ' + esc(h.pinyin) + '</p>' +
        '<h1>Hexagram ' + h.number + ': ' + esc(h.name) + '</h1>' +
        '<p class="meta">' + esc(h.upper.name) + ' (' + esc(h.upper.image) + ') over ' + esc(h.lower.name) + ' (' + esc(h.lower.image) + ')</p>' +
        '<p class="lede">' + esc(h.judgment) + '</p>' +
        '<h2>The image</h2>' + p(h.image) +
        '<h3>' + esc(h.upper.name) + ', above</h3>' + p(h.upper.attribute.charAt(0).toUpperCase() + h.upper.attribute.slice(1) + '.') +
        '<h3>' + esc(h.lower.name) + ', below</h3>' + p(h.lower.attribute.charAt(0).toUpperCase() + h.lower.attribute.slice(1) + '.') +
        '<div class="ask">' + esc(h.movement) + '</div>' +
        '<h2>The six lines</h2><p class="meta">Read from the bottom up.</p><ol class="lines">' + lines + '</ol>' +
        '<h2>The same figure in Human Design</h2><p>Human Design took its sixty four gates from this book, in this numbering, so hexagram ' + h.number +
        ' is <a href="' + gatePath(h.number) + '">Gate ' + h.number + ', ' + esc(M.HD.GATES[h.number][0]) + '</a>.</p>' +
        pn(prev, next) });
  });
  add({ path: '/learn/i-ching/', type: 'CollectionPage', app: '/library/i-ching', appLabel: 'Open the Book of Changes in inCommon', title: 'The I Ching: All 64 Hexagrams',
    h1: 'The Book of Changes', desc: 'All sixty four hexagrams of the I Ching, the Book of Changes, each with its judgment, its image and its six lines, written for inCommon.',
    crumbs: [['The Book of Changes', '/learn/i-ching/']],
    body: '<p class="kicker">The I Ching</p><h1>The Book of Changes</h1>' +
      '<p class="lede">Sixty four figures, each six lines of yin or yang, each one a situation and the way it is moving.</p>' +
      '<ul class="list">' + hexes.map(h => listItem(hexPath(h.number), h.number + '. ' + h.name, h.pinyin + ' \u00b7 ' + h.upper.name + ' over ' + h.lower.name)).join('') + '</ul>' });

  /* Human Design: sixty four gates */
  const G = M.HD.GATES, TL = M.TL;
  for (let n = 1; n <= 64; n++) {
    const g = G[n], t = TL.GATE[n] || {}, gl = TL.GATE_LINE[n] || [];
    if (!g) die('hd-atlas has no gate ' + n);
    const chans = (M.HD.channelsFor(n) || []).map(c => '<li><a href="' + gatePath(c.partner) + '"><strong>' + esc(c.name) +
      ' \u00b7 ' + esc(c.key) + '</strong><span>' + esc(c.theme) + '. ' + esc(c.meaning) + ' With Gate ' + c.partner + ', ' + esc(G[c.partner][0]) + '.</span></a></li>').join('');
    const lines = gl.map((l, j) => '<li><b>Line ' + (j + 1) + (M.HD.LINES[j + 1] ? ', ' + esc(M.HD.LINES[j + 1].name) : '') + '</b>' + esc(l) + '</li>').join('');
    add({ path: gatePath(n), type: 'Article', app: '/library/human-design-atlas/gate/' + n, appLabel: 'Open Gate ' + n + ' in inCommon',
      title: 'Human Design Gate ' + n + ', ' + g[0], h1: 'Gate ' + n + ': ' + g[0],
      desc: clip('Human Design Gate ' + n + ', ' + g[0] + ', in the ' + g[1] + ' center. ' + g[2] + ' ' + (t.sky || ''), 158),
      crumbs: [['Human Design gates', '/learn/human-design/gates/']],
      body: '<p class="kicker">Human Design \u00b7 ' + esc(g[1]) + ' center</p><h1>Gate ' + n + ': ' + esc(g[0]) + '</h1>' +
        '<p class="lede">' + esc(g[2]) + '</p>' +
        '<h3>When it overshoots</h3>' + p(g[3]) + '<h3>At its best</h3>' + p(g[4]) +
        (t.held ? '<h2>Carried and open</h2><h3>In a chart that carries it</h3>' + p(t.held) + '<h3>In a chart where it is open</h3>' + p(t.open) +
          '<h3>When it is in the sky</h3>' + p(t.sky) : '') +
        (t.ask ? '<div class="ask">' + esc(t.ask) + '</div>' : '') +
        (lines ? '<h2>The six lines</h2><ol class="lines">' + lines + '</ol>' : '') +
        (chans ? '<h2>Channels through this gate</h2><ul class="list">' + chans + '</ul>' : '') +
        '<h2>The same figure in the Book of Changes</h2><p>Gate ' + n + ' is <a href="' + hexPath(n) + '">hexagram ' + n + ', ' +
        esc(hexes[n - 1].name) + '</a>, read by an older tradition.</p>' +
        pn(n > 1 ? ['Gate ' + (n - 1), gatePath(n - 1)] : null, n < 64 ? ['Gate ' + (n + 1), gatePath(n + 1)] : null) });
  }
  const byCentre = {};
  for (let n = 1; n <= 64; n++) (byCentre[G[n][1]] = byCentre[G[n][1]] || []).push(n);
  add({ path: '/learn/human-design/gates/', type: 'CollectionPage', app: '/library/human-design-atlas', appLabel: 'Open the Human Design Atlas in inCommon', title: 'Human Design Gates: All 64',
    h1: 'The 64 gates of Human Design', desc: 'All sixty four Human Design gates, grouped by center, each with its theme, its six lines and the channels it completes.',
    crumbs: [['Human Design gates', '/learn/human-design/gates/']],
    body: '<p class="kicker">Human Design</p><h1>The 64 gates</h1><p class="lede">Each gate is one of the sixty four hexagrams, placed in one of the nine centers.</p>' +
      '<ul class="grid" aria-label="Gates by number">' + Array.from({ length: 64 }, (_, i) => '<li><a href="' + gatePath(i + 1) + '" aria-label="Gate ' + (i + 1) + ', ' + esc(G[i + 1][0]) + '">' + (i + 1) + '</a></li>').join('') + '</ul>' +
      Object.keys(byCentre).map(c => '<h2>' + esc(c) + ' center</h2><ul class="list">' + byCentre[c].map(n => listItem(gatePath(n), 'Gate ' + n + ': ' + G[n][0], G[n][2])).join('') + '</ul>').join('') });

  /* Angel numbers: only the written ones */
  const nums = Object.keys(M.AN.meanings).map(Number).sort((a, b) => a - b);
  const anPath = n => '/learn/angel-numbers/' + n + '/';
  nums.forEach((n, i) => {
    const r = M.AN.lookup(n);
    if (!r || r.composed) return;
    const digits = r.digits.filter((d, j, a) => a.findIndex(x => x.d === d.d) === j)
      .map(d => '<li><b>' + d.d + '</b>' + esc(d.short.charAt(0).toUpperCase() + d.short.slice(1)) + '</li>').join('');
    add({ path: anPath(n), type: 'Article', app: '/library/synchronicities/number/' + n, appLabel: 'Open ' + n + ' in inCommon', title: 'Angel Number ' + n + ' Meaning', h1: 'Angel number ' + n,
      desc: clip('What angel number ' + n + ' means when it keeps appearing. ' + r.traditional + ' ' + r.possibility, 158),
      crumbs: [['Angel numbers', '/learn/angel-numbers/']],
      body: '<p class="kicker">Angel numbers</p><h1>Angel number ' + n + '</h1><p class="lede">' + esc(r.traditional) + '</p>' +
        '<div class="ask">' + esc(r.possibility) + '</div>' +
        (r.digits.length > 1 ? '<h2>The digits in it</h2><ol class="lines">' + digits + '</ol><h3>Reduced to ' + r.reduced + '</h3>' + p(r.rootLine) : '') +
        '<h2>Keep a record of it</h2><p>A repeating number becomes a pattern only once it is dated. The Synchronicities page in inCommon keeps each sighting in one run with the animals and anything else that repeats.</p>' +
        pn(i ? ['Angel number ' + nums[i - 1], anPath(nums[i - 1])] : null, i < nums.length - 1 ? ['Angel number ' + nums[i + 1], anPath(nums[i + 1])] : null) });
  });
  add({ path: '/learn/angel-numbers/', type: 'CollectionPage', app: '/library/synchronicities', appLabel: 'Open Synchronicities in inCommon', title: 'Angel Numbers and Their Meanings',
    h1: 'Angel numbers', desc: 'Meanings for repeating numbers, from 1 to 5555: 111, 222, 333, 444, 555, 1111, 1212 and more, each with a question to bring to it.',
    crumbs: [['Angel numbers', '/learn/angel-numbers/']],
    body: '<p class="kicker">Synchronicities</p><h1>Angel numbers</h1><p class="lede">A number that keeps turning up, on a clock, a receipt or a licence plate.</p>' +
      '<ul class="list">' + nums.map(n => listItem(anPath(n), 'Angel number ' + n, clip(M.AN.lookup(n).traditional, 110))).join('') + '</ul>' });

  /* Dream symbols */
  const dreams = [];
  Object.keys(M.DS.CAT_LABEL).forEach(c => M.DS.byCategory(c).forEach(e => dreams.push(e)));
  const drPath = e => '/learn/dreams/' + slug(e.key) + '/';
  const drTitle = e => e.name.replace(/^(A|An|The) /, '');
  dreams.forEach((e, i) => {
    const variants = (e.variants || []).map(v => '<h3>' + esc(v.label) + '</h3>' + p(v.text)).join('');
    add({ path: drPath(e), type: 'Article', app: '/library/dreams/' + e.category + '/' + e.key, appLabel: 'Open this dream symbol in inCommon', title: drTitle(e) + ' in a Dream: Meaning', h1: e.name,
      desc: clip('Dreaming of ' + e.name.toLowerCase() + '. ' + e.meaning, 158),
      crumbs: [['Dream symbols', '/learn/dreams/']],
      body: '<p class="kicker">Dream symbols \u00b7 ' + esc(e.categoryLabel) + (e.archetypeLabel ? ' \u00b7 ' + esc(e.archetypeLabel) : '') + '</p>' +
        '<h1>' + esc(e.name) + '</h1><p class="lede">' + esc(e.meaning) + '</p>' +
        '<h2>Where the reading comes from</h2>' + p(e.origin) +
        (variants ? '<h2>Versions of the dream</h2>' + variants : '') +
        '<div class="ask">' + esc(e.possibility) + '</div>' +
        pn(i ? [dreams[i - 1].name, drPath(dreams[i - 1])] : null, i < dreams.length - 1 ? [dreams[i + 1].name, drPath(dreams[i + 1])] : null) });
  });
  add({ path: '/learn/dreams/', type: 'CollectionPage', app: '/library/dreams', appLabel: 'Open Dream Symbols in inCommon', title: 'Dream Symbols and Their Meanings',
    h1: 'Dream symbols', desc: 'What common dream images can mean: falling, being chased, teeth, water, houses, snakes, storms and more, each with a question only the dreamer can answer.',
    crumbs: [['Dream symbols', '/learn/dreams/']],
    body: '<p class="kicker">The Dream Journal</p><h1>Dream symbols</h1><p class="lede">Images read as dream images: every figure first as a part of the person dreaming it.</p>' +
      Object.keys(M.DS.CAT_LABEL).map(c => '<h2>' + esc(M.DS.CAT_LABEL[c]) + '</h2><ul class="list">' +
        dreams.filter(e => e.category === c).map(e => listItem(drPath(e), e.name, clip(e.meaning, 110))).join('') + '</ul>').join('') });

  /* Animal sightings */
  const animals = M.AS.names.map(nm => M.AS.lookup(nm)).filter(Boolean);
  const anmPath = a => '/learn/animals/' + slug(a.name) + '/';
  animals.forEach((a, i) => {
    add({ path: anmPath(a), type: 'Article', app: '/library/synchronicities/animal/' + slug(a.name), appLabel: 'Open the ' + a.name.toLowerCase() + ' in inCommon', title: a.name.replace(/\b[a-z]/g, c => c.toUpperCase()) + ' Symbolism and Meaning', h1: a.name,
      desc: clip('What it can mean when you keep seeing a ' + a.name.toLowerCase() + '. ' + a.tradition, 158),
      crumbs: [['Animal symbolism', '/learn/animals/']],
      body: '<p class="kicker">Animal symbolism</p><h1>' + esc(a.name) + '</h1>' +
        '<h2>What the tradition holds</h2>' + p(a.tradition) +
        '<h2>Where that reading came from</h2>' + p(a.origin) +
        '<div class="ask">' + esc(a.possibility) + '</div>' +
        pn(i ? [animals[i - 1].name, anmPath(animals[i - 1])] : null, i < animals.length - 1 ? [animals[i + 1].name, anmPath(animals[i + 1])] : null) });
  });
  add({ path: '/learn/animals/', type: 'CollectionPage', app: '/library/synchronicities', appLabel: 'Open Synchronicities in inCommon', title: 'Animal Symbolism: What Seeing an Animal Can Mean',
    h1: 'Animal symbolism', desc: 'Seventy two animals people report noticing, from crows and cardinals to deer and dragonflies: what each tradition holds, and where that reading came from.',
    crumbs: [['Animal symbolism', '/learn/animals/']],
    body: '<p class="kicker">Synchronicities</p><h1>Animal symbolism</h1><p class="lede">The animals people actually report noticing, each read in three parts kept apart.</p>' +
      '<ul class="list">' + animals.map(a => listItem(anmPath(a), a.name, clip(a.tradition, 110))).join('') + '</ul>' });

  /* The index */
  add({ path: '/learn/', type: 'CollectionPage', title: 'Learn: Astrology, Human Design, the I Ching and Symbols',
    h1: 'Learn', desc: 'The reference library behind inCommon: the 64 Human Design gates, the 64 hexagrams of the I Ching, angel numbers, dream symbols and animal symbolism.',
    crumbs: [],
    body: '<p class="kicker">The inCommon library</p><h1>Learn</h1><p class="lede">The reference writing behind inCommon, open to anybody.</p><ul class="list">' +
      listItem('/learn/human-design/gates/', 'The 64 gates of Human Design', 'Every gate with its theme, its six lines and its channels.') +
      listItem('/learn/i-ching/', 'The Book of Changes', 'All sixty four hexagrams, with the judgment, the image and the lines.') +
      listItem('/learn/angel-numbers/', 'Angel numbers', 'Repeating numbers and what the practice reads in them.') +
      listItem('/learn/dreams/', 'Dream symbols', 'Common dream images, each with a question only the dreamer can close.') +
      listItem('/learn/animals/', 'Animal symbolism', 'Seventy two animals people notice, and where each reading came from.') + '</ul>' });

  return pages;
}

/* ---------- write ---------- */
function run(OUT) {
  if (!OUT) die('no output folder given');
  const M = loadModules();
  const pages = build(M);

  /* The host must agree with the cover and robots.txt. */
  const cover = fs.readFileSync(path.join(appDir, 'cover.html'), 'utf8');
  if (cover.indexOf('<link rel="canonical" href="' + SITE + '/">') === -1) die('the cover\'s canonical is not ' + SITE + '/; change both together');
  const robotsAt = path.join(OUT, 'robots.txt');
  if (!fs.existsSync(robotsAt) || fs.readFileSync(robotsAt, 'utf8').indexOf('Sitemap: ' + SITE + '/sitemap.xml') === -1)
    die('robots.txt does not name ' + SITE + '/sitemap.xml');

  const seen = new Set();
  const learn = path.join(OUT, 'learn');
  fs.rmSync(learn, { recursive: true, force: true });
  for (const pg of pages) {
    if (seen.has(pg.path)) die('two pages at ' + pg.path);
    seen.add(pg.path);
    const html = page(pg);
    if (DASHES.test(html)) die(pg.path + ' contains an em or en dash; this repo has none anywhere');
    for (const re of MARKS) if (re.test(html)) die(pg.path + ' carries a barred mark: ' + re);
    if (LABEL_RE.test(html)) die(pg.path + ' uses bodygraph as a heading');
    const dir = path.join(OUT, pg.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }
  /* Every internal link lands on a page that exists. */
  for (const pg of pages) {
    const html = fs.readFileSync(path.join(OUT, pg.path, 'index.html'), 'utf8');
    for (const m of html.matchAll(/href="(\/learn\/[^"]*)"/g)) if (!seen.has(m[1])) die(pg.path + ' links to ' + m[1] + ', which was not built');
  }

  /* The sitemap: the cover, the legal pages, and every page above. */
  const fixed = ['/', '/terms.html', '/privacy.html', '/accessibility.html', '/delete-account.html'];
  const urls = fixed.concat(pages.map(pg => pg.path).sort());
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- GENERATED by tools/build-learn-pages.js. Do not edit by hand. app.html is left out: it is noindex. -->\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + SITE + u + '</loc></url>').join('\n') + '\n</urlset>\n';
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), xml, 'utf8');
  return { pages: pages.length, urls: urls.length };
}

module.exports = { run, SITE };
if (require.main === module) {
  /* The bundle folder is named once, in BUNDLE in build-bundle.js, and read from there. */
  const m = /const BUNDLE = path\.join\(repo, 'deploy', '([^']+)'\)/.exec(fs.readFileSync(path.join(__dirname, 'build-bundle.js'), 'utf8'));
  if (!m && !process.argv[2]) die('could not read BUNDLE out of build-bundle.js');
  const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(repo, 'deploy', m[1]);
  const r = run(out);
  console.log('build-learn-pages: ' + r.pages + ' pages under learn/, sitemap with ' + r.urls + ' addresses');
}
