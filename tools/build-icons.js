#!/usr/bin/env node
/* build-icons.js: draw the identity mark into the PWA icons. GENERATED OUTPUT.
 *
 * WHY THIS EXISTS RATHER THAN A DESIGN EXPORT. The mark is two circles and the
 * lens they share. That is a shape with an exact definition, so it can be
 * rasterised from the definition instead of being exported by hand, and the
 * icons can never drift from the mark the app draws in its own boot screen.
 * Rerun it and the icons are identical, which is not true of a manual export.
 *
 * WHY NOT A BROWSER CANVAS. It was the obvious route, and it means shipping a
 * few hundred kilobytes of base64 back out of a headless page for every build.
 * The shape is analytic, so a distance test per sample point is both smaller
 * and exactly reproducible.
 *
 * ANTIALIASING is 4x4 supersampling: sixteen coverage samples per pixel, which
 * is enough for a curve this smooth at these sizes and keeps the whole thing a
 * pure function of the geometry.
 *
 * THE MASKABLE SAFE ZONE decides the scale. manifest.json declares icon-512 as
 * both "any" and "maskable", and a maskable icon may be cropped to the central
 * 80%, a circle of radius 0.4 from the centre. The mark's own half width is
 * 0.39 of the tile at the identity's proportions, which would sit right on the
 * cut. MARK_SCALE pulls it to 0.31 so the shape survives whatever mask an OS
 * applies, and it still reads at 76px, which is the smallest size the identity
 * sheet asks it to hold at.
 *
 * Usage: node tools/build-icons.js [--out <dir>]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const repo = path.resolve(__dirname, '..');
const outFlag = process.argv.indexOf('--out');
const OUT = outFlag !== -1 && process.argv[outFlag + 1]
  ? path.resolve(process.argv[outFlag + 1])
  : path.join(repo, 'deploy');

/* ---- the identity, from inCommon Logo / 02 horizontal lockup ---- */
const RINGS = [0x8b, 0x5c, 0xf6];   /* #8b5cf6, the two wholes */
const LENS  = [0x2f, 0xff, 0x8f];   /* #2fff8f, reserved for what they share */
const FIELD = [0x0b, 0x09, 0x10];   /* #0b0910, the icon field */
const APPBG = [0x05, 0x06, 0x0a];   /* the app's own --bg, so the splash seam is invisible */

/* Proportions in unit space, taken from the mark the app draws: r 0.26 with
   centres 0.13 either side of the middle, stroke 0.045. */
const R0 = 0.26, DX0 = 0.13, SW0 = 0.045;
const MARK_SCALE = 0.795;

const SS = 4;                        /* supersampling grid, SS x SS per pixel */

function mix(dst, src, a) {
  return [
    Math.round(dst[0] + (src[0] - dst[0]) * a),
    Math.round(dst[1] + (src[1] - dst[1]) * a),
    Math.round(dst[2] + (src[2] - dst[2]) * a)
  ];
}

/* Coverage of the two shapes at one sample point, in unit coordinates centred
   on the mark. Returns [lens, ring] as 0 or 1. */
function sample(x, y, r, dx, hw) {
  const d1 = Math.hypot(x + dx, y), d2 = Math.hypot(x - dx, y);
  const lens = (d1 <= r && d2 <= r) ? 1 : 0;
  const ring = (Math.abs(d1 - r) <= hw || Math.abs(d2 - r) <= hw) ? 1 : 0;
  return [lens, ring];
}

function render(w, h, bg, markFrac) {
  /* markFrac: the mark's full width as a fraction of the shorter side. */
  const side = Math.min(w, h);
  const unit = side * markFrac / ((R0 + DX0) * 2 * MARK_SCALE);
  const r = R0 * MARK_SCALE, dx = DX0 * MARK_SCALE, hw = SW0 * MARK_SCALE / 2;
  const cx = w / 2, cy = h / 2;
  const buf = Buffer.alloc(w * h * 3);

  /* A soft bloom around the lens, the glow the identity sheet carries. */
  const glowR = (r + 0.14);

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let lensHits = 0, ringHits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = ((px + (sx + 0.5) / SS) - cx) / unit;
          const uy = ((py + (sy + 0.5) / SS) - cy) / unit;
          const [l, g] = sample(ux, uy, r, dx, hw);
          lensHits += l; ringHits += g;
        }
      }
      const n = SS * SS;
      let c = bg;
      const ux = (px + 0.5 - cx) / unit, uy = (py + 0.5 - cy) / unit;
      const gd = Math.hypot(ux, uy);
      if (gd < glowR) {
        const t = 1 - gd / glowR;
        c = mix(c, LENS, 0.10 * t * t);
      }
      if (lensHits) c = mix(c, LENS, lensHits / n);
      if (ringHits) c = mix(c, RINGS, ringHits / n);
      const o = (py * w + px) * 3;
      buf[o] = c[0]; buf[o + 1] = c[1]; buf[o + 2] = c[2];
    }
  }
  return buf;
}

/* ---- a minimal PNG writer: IHDR, IDAT, IEND ---- */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function png(w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;  /* 8 bit truecolour */
  /* One filter byte per scanline, filter 0: these are smooth gradients and
     flat fields, and deflate handles them well enough without per row filters. */
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const JOBS = [
  { file: 'icon-192.png', w: 192,  h: 192,  bg: FIELD, frac: 0.62 },
  { file: 'icon-512.png', w: 512,  h: 512,  bg: FIELD, frac: 0.62 },
  { file: 'splash.png',   w: 1170, h: 2532, bg: APPBG, frac: 0.42 }
];

fs.mkdirSync(OUT, { recursive: true });
console.log('build-icons: writing into ' + OUT);
for (const j of JOBS) {
  const buf = png(j.w, j.h, render(j.w, j.h, j.bg, j.frac));
  fs.writeFileSync(path.join(OUT, j.file), buf);
  console.log('  ' + j.file.padEnd(15) + j.w + ' x ' + j.h + '   ' + (buf.length / 1024).toFixed(0) + ' KB');
}
