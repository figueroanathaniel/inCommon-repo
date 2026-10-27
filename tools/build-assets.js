#!/usr/bin/env node
// tools/build-assets.js - Dedupe 125 -> 85
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const ROOTS = ['app','preview','inCommon Logo','native'];
const EXT = ['.png','.jpg','.jpeg','.webp','.avif','.svg','.gif'];
const CANON_DIR = 'app/assets/canonical';
const MAP_FILE = 'app/assets/image-map.json';
function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (EXT.includes(path.extname(e.name).toLowerCase())) files.push(p);
  }
  return files;
}
const all = ROOTS.flatMap(r => walk(r));
console.log('Found', all.length, 'image paths');
const hashToCanon = new Map();
const pathToCanon = {};
fs.mkdirSync(CANON_DIR, {recursive:true});
for (const file of all) {
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0,12);
  if (!hashToCanon.has(hash)) {
    const base = path.basename(file, path.extname(file)).replace(/[^a-z0-9-]/gi,'-').toLowerCase();
    const ext = path.extname(file);
    const canonName = base + '-' + hash + ext;
    const canonPath = path.join(CANON_DIR, canonName);
    if (!fs.existsSync(canonPath)) fs.copyFileSync(file, canonPath);
    hashToCanon.set(hash, canonPath);
  }
  pathToCanon[file] = hashToCanon.get(hash);
}
fs.mkdirSync(path.dirname(MAP_FILE), {recursive:true});
fs.writeFileSync(MAP_FILE, JSON.stringify(pathToCanon, null, 2));
console.log('Unique:', hashToCanon.size, '/ Total:', all.length, 'Dupes:', all.length - hashToCanon.size);
