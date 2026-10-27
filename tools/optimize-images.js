#!/usr/bin/env node
// tools/optimize-images.js - needs npm i sharp
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
const CANON_DIR = 'app/assets/canonical';
const WIDTHS = [480, 768, 1200, 1920];
const files = fs.readdirSync(CANON_DIR).filter(f => !f.includes('-480w'));
console.log('Optimizing', files.length);
for (const file of files) {
  const full = path.join(CANON_DIR, file);
  const {name} = path.parse(file);
  if (file.endsWith('.avif') || file.endsWith('.webp')) continue;
  const buf = fs.readFileSync(full);
  for (const w of WIDTHS) {
    const avifOut = path.join(CANON_DIR, name + '-' + w + 'w.avif');
    const webpOut = path.join(CANON_DIR, name + '-' + w + 'w.webp');
    if (!fs.existsSync(avifOut)) await sharp(buf).resize({width:w, withoutEnlargement:true}).avif({quality:60}).toFile(avifOut);
    if (!fs.existsSync(webpOut)) await sharp(buf).resize({width:w, withoutEnlargement:true}).webp({quality:75}).toFile(webpOut);
  }
}
console.log('Done');
