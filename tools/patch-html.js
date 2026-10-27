#!/usr/bin/env node
// tools/patch-html.js - Replace <img src> with <picture> AVIF/WebP using image-map.json
// Run after build-assets.js + optimize-images.js
// Run: node tools/patch-html.js

import fs from 'fs';
import path from 'path';

const MAP_FILE = 'app/assets/image-map.json';
const HTML_FILE = 'app/inCommonApp v2.dc.html';
const CANON_DIR = 'app/assets/canonical';

if (!fs.existsSync(MAP_FILE)) {
  console.log('Missing', MAP_FILE, '- run node tools/build-assets.js first');
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
let html = fs.readFileSync(HTML_FILE, 'utf8');

let replaced = 0;

// Helper: build <picture> block if responsive files exist
function buildPicture(canonicalPath, alt = '') {
  const {name, dir} = path.parse(canonicalPath);
  // canonical is like app/assets/canonical/hero-abc123.jpg -> base name hero-abc123
  const base = name; // already includes hash
  const avif480 = path.join(CANON_DIR, base + '-480w.avif');
  const avif1200 = path.join(CANON_DIR, base + '-1200w.avif');
  const webp480 = path.join(CANON_DIR, base + '-480w.webp');
  const webp1200 = path.join(CANON_DIR, base + '-1200w.webp');

  // If optimized versions don't exist, fall back to simple canonical
  if (!fs.existsSync(avif480)) {
    return `<img src="./assets/canonical/${path.basename(canonicalPath)}" loading="lazy" decoding="async" alt="${alt}">`;
  }

  // Make paths relative to app/ folder (HTML lives in app/)
  const rel = (p) => './assets/canonical/' + path.basename(p);

  return `<picture>
  <source srcset="${rel(avif480)} 480w, ${rel(avif1200)} 1200w" type="image/avif">
  <source srcset="${rel(webp480)} 480w, ${rel(webp1200)} 1200w" type="image/webp">
  <img src="${rel(canonicalPath)}" loading="lazy" decoding="async" alt="${alt}">
</picture>`;
}

// 1. Replace exact old paths from map
for (const [oldPath, canonPath] of Object.entries(map)) {
  // oldPath may be like "preview/foo.png" or "app/...". Normalize to just filename for search
  const oldBase = path.basename(oldPath);
  if (!oldBase) continue;
  const canonBase = path.basename(canonPath);

  // Replace <img ... src="...oldBase...">
  const regex = new RegExp(`<img([^>]*?)src=["'][^"']*${oldBase.replace(/[-/\^$*+?.()|[\]{}]/g, '\$&')}["']([^>]*?)>`, 'gi');

  html = html.replace(regex, (match, pre, post) => {
    // try to keep alt if present
    const altMatch = (pre + post).match(/alt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';
    replaced++;
    return buildPicture(canonPath, alt);
  });
}

// 2. Also replace any remaining direct canonical refs to use ./assets/canonical/
html = html.replace(/src=["'](\.\/)?(app\/assets\/canonical\/|assets\/canonical\/)([^"']+)["']/g, 'src="./assets/canonical/$3"');

fs.writeFileSync(HTML_FILE + '.bak', fs.readFileSync(HTML_FILE)); // backup
fs.writeFileSync(HTML_FILE, html);

console.log(`Patched ${replaced} <img> tags to <picture> with AVIF/WebP`);
console.log('Backup saved to', HTML_FILE + '.bak');
console.log('Next: node tools/build-bundle.js and test with npx serve .');
